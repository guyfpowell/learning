import { TeamController } from '../TeamController';
import { teamService } from '../../services/TeamService';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/TeamService');

describe('TeamController', () => {
  let controller: TeamController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new TeamController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  function makeReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
      user: { id: 'u1', email: 'user@test.com', role: 'user' },
      body: {},
      query: {},
      params: {},
      ...overrides,
    } as AuthenticatedRequest;
  }

  describe('createTeam', () => {
    it('returns 201 with team', async () => {
      const team = { id: 't1', name: 'Acme', slug: 'acme', ownerId: 'u1' };
      (teamService.createTeam as jest.Mock).mockResolvedValue(team);

      const req = makeReq({ body: { name: 'Acme', slug: 'acme' } });
      await controller.createTeam(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: team }));
    });

    it('calls next on missing name', async () => {
      const req = makeReq({ body: {} });
      await controller.createTeam(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getTeam', () => {
    it('returns 200 with team', async () => {
      const team = { id: 't1', name: 'Acme', members: [] };
      (teamService.getTeam as jest.Mock).mockResolvedValue(team);

      const req = makeReq({ params: { id: 't1' } });
      await controller.getTeam(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: team }));
    });

    it('calls next on error', async () => {
      (teamService.getTeam as jest.Mock).mockRejectedValue(new Error('not found'));
      const req = makeReq({ params: { id: 't1' } });
      await controller.getTeam(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('inviteMember', () => {
    it('returns 200 with invite token', async () => {
      const result = { token: 'tok', email: 'new@test.com', teamId: 't1' };
      (teamService.inviteMember as jest.Mock).mockResolvedValue(result);

      const req = makeReq({ params: { id: 't1' }, body: { email: 'new@test.com' } });
      await controller.inviteMember(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('calls next on missing email', async () => {
      const req = makeReq({ params: { id: 't1' }, body: {} });
      await controller.inviteMember(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('acceptInvite', () => {
    it('returns 200 on success', async () => {
      const membership = { id: 'tm1', teamId: 't1', userId: 'u1', role: 'member' };
      (teamService.acceptInvite as jest.Mock).mockResolvedValue(membership);

      const req = makeReq({ params: { id: 't1' }, body: { token: 'valid-token' } });
      await controller.acceptInvite(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('calls next on missing token', async () => {
      const req = makeReq({ params: { id: 't1' }, body: {} });
      await controller.acceptInvite(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('returns 200 on success', async () => {
      (teamService.removeMember as jest.Mock).mockResolvedValue(undefined);

      const req = makeReq({ params: { id: 't1', userId: 'u2' } });
      await controller.removeMember(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('calls next on error', async () => {
      (teamService.removeMember as jest.Mock).mockRejectedValue(new Error('forbidden'));
      const req = makeReq({ params: { id: 't1', userId: 'u2' } });
      await controller.removeMember(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getTeamSubscription', () => {
    it('returns 200 with subscription', async () => {
      const sub = { id: 'ts1', teamId: 't1', seatLimit: 20, status: 'active' };
      (teamService.getTeamSubscription as jest.Mock).mockResolvedValue(sub);

      const req = makeReq({ params: { id: 't1' } });
      await controller.getTeamSubscription(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: sub }));
    });

    it('returns null subscription without error', async () => {
      (teamService.getTeamSubscription as jest.Mock).mockResolvedValue(null);

      const req = makeReq({ params: { id: 't1' } });
      await controller.getTeamSubscription(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
