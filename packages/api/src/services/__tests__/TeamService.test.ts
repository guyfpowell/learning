import { TeamService } from '../TeamService';
import { prisma } from '../../db';
import { AppError } from '../../middleware/error-handler';

jest.mock('../../db', () => ({
  prisma: {
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    teamMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    teamSubscription: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-invite-token'),
  verify: jest.fn(),
}));

import jwt from 'jsonwebtoken';

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(() => {
    service = new TeamService();
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('creates team and adds owner as admin member', async () => {
      const mockTeam = { id: 't1', name: 'Acme PM', slug: 'acme-pm', ownerId: 'u1', createdAt: new Date() };
      (prisma.team.create as jest.Mock).mockResolvedValue({ ...mockTeam, members: [{ id: 'tm1', role: 'admin' }] });

      const result = await service.createTeam('u1', { name: 'Acme PM', slug: 'acme-pm' });

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Acme PM',
            slug: 'acme-pm',
            ownerId: 'u1',
            members: { create: { userId: 'u1', role: 'admin' } },
          }),
        })
      );
      expect(result.id).toBe('t1');
    });

    it('generates slug from name when not provided', async () => {
      (prisma.team.create as jest.Mock).mockResolvedValue({
        id: 't2', name: 'Acme Corp', slug: 'acme-corp', ownerId: 'u1', members: [],
      });

      await service.createTeam('u1', { name: 'Acme Corp' });

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-corp' }),
        })
      );
    });
  });

  describe('getTeam', () => {
    it('returns team with members for a team member', async () => {
      const mockMembership = { teamId: 't1', userId: 'u1', role: 'member' };
      const mockTeam = { id: 't1', name: 'Acme', members: [mockMembership] };
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      const result = await service.getTeam('t1', 'u1');

      expect(result).toEqual(mockTeam);
    });

    it('throws 403 if user is not a member', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTeam('t1', 'u1')).rejects.toThrow(AppError);
    });

    it('throws 404 if team not found', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTeam('t1', 'u1')).rejects.toThrow(AppError);
    });
  });

  describe('inviteMember', () => {
    it('returns an invite token for a team admin', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'admin' });

      const result = await service.inviteMember('t1', 'u1', 'newmember@example.com');

      expect(result.token).toBe('mock-invite-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { teamId: 't1', email: 'newmember@example.com' },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });

    it('throws 403 if inviter is not a team admin', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });

      await expect(service.inviteMember('t1', 'u1', 'new@example.com')).rejects.toThrow(AppError);
    });

    it('throws 403 if inviter is not in the team', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.inviteMember('t1', 'u1', 'new@example.com')).rejects.toThrow(AppError);
    });
  });

  describe('acceptInvite', () => {
    it('adds user to team and returns membership', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ teamId: 't1', email: 'user@example.com' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2', email: 'user@example.com' });
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.teamMember.create as jest.Mock).mockResolvedValue({ id: 'tm2', teamId: 't1', userId: 'u2', role: 'member' });

      const result = await service.acceptInvite('valid-token', 'u2');

      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: { teamId: 't1', userId: 'u2', role: 'member' },
      });
      expect(result.teamId).toBe('t1');
    });

    it('throws 400 if token email does not match user email', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ teamId: 't1', email: 'other@example.com' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2', email: 'user@example.com' });

      await expect(service.acceptInvite('valid-token', 'u2')).rejects.toThrow(AppError);
    });

    it('throws 409 if user is already a team member', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ teamId: 't1', email: 'user@example.com' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2', email: 'user@example.com' });
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(service.acceptInvite('valid-token', 'u2')).rejects.toThrow(AppError);
    });

    it('throws 400 if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

      await expect(service.acceptInvite('bad-token', 'u2')).rejects.toThrow(AppError);
    });
  });

  describe('removeMember', () => {
    it('allows team admin to remove a member', async () => {
      (prisma.teamMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' })  // requester
        .mockResolvedValueOnce({ id: 'tm3', userId: 'u3' }); // target
      (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'u1' });
      (prisma.teamMember.delete as jest.Mock).mockResolvedValue({});

      await service.removeMember('t1', 'u1', 'u3');

      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 't1', userId: 'u3' } },
      });
    });

    it('throws 403 if requester is not an admin', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'member' });

      await expect(service.removeMember('t1', 'u1', 'u3')).rejects.toThrow(AppError);
    });

    it('throws 400 if trying to remove the team owner', async () => {
      (prisma.teamMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'admin' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'u3' });

      await expect(service.removeMember('t1', 'u1', 'u3')).rejects.toThrow(AppError);
    });
  });

  describe('getTeamSubscription', () => {
    it('returns subscription if exists', async () => {
      const sub = { id: 'ts1', teamId: 't1', seatLimit: 20, status: 'active' };
      (prisma.teamSubscription.findUnique as jest.Mock).mockResolvedValue(sub);

      const result = await service.getTeamSubscription('t1');

      expect(result).toEqual(sub);
    });

    it('returns null if no subscription', async () => {
      (prisma.teamSubscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getTeamSubscription('t1');

      expect(result).toBeNull();
    });
  });
});
