import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface InviteTokenPayload {
  teamId: string;
  email: string;
}

export interface CreateTeamInput {
  name: string;
  slug?: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export class TeamService {
  async createTeam(ownerId: string, input: CreateTeamInput) {
    const slug = input.slug ?? slugify(input.name);
    return prisma.team.create({
      data: {
        name: input.name,
        slug,
        ownerId,
        members: { create: { userId: ownerId, role: 'admin' } },
      },
      include: { members: true },
    });
  }

  async getTeam(teamId: string, userId: string) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) throw new AppError('FORBIDDEN', 'You are not a member of this team', 403);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!team) throw new AppError('NOT_FOUND', 'Team not found', 404);

    return team;
  }

  async inviteMember(teamId: string, inviterUserId: string, email: string) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: inviterUserId } },
    });
    if (!membership || membership.role !== 'admin') {
      throw new AppError('FORBIDDEN', 'Only team admins can invite members', 403);
    }

    const token = jwt.sign({ teamId, email } as InviteTokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Email stubbed — would send via SendGrid in production
    console.log(`[TeamService] Invite email stubbed for ${email}, teamId=${teamId}`);

    return { token, email, teamId };
  }

  async acceptInvite(token: string, userId: string) {
    let payload: InviteTokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as InviteTokenPayload;
    } catch {
      throw new AppError('INVALID_TOKEN', 'Invite token is invalid or expired', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== payload.email) {
      throw new AppError('FORBIDDEN', 'This invite was sent to a different email address', 400);
    }

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: payload.teamId, userId } },
    });
    if (existing) {
      throw new AppError('CONFLICT', 'You are already a member of this team', 409);
    }

    return prisma.teamMember.create({
      data: { teamId: payload.teamId, userId, role: 'member' },
    });
  }

  async removeMember(teamId: string, requesterUserId: string, targetUserId: string) {
    const requester = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: requesterUserId } },
    });
    if (!requester || requester.role !== 'admin') {
      throw new AppError('FORBIDDEN', 'Only team admins can remove members', 403);
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team?.ownerId === targetUserId) {
      throw new AppError('BAD_REQUEST', 'Cannot remove the team owner', 400);
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
  }

  async getTeamSubscription(teamId: string) {
    return prisma.teamSubscription.findUnique({ where: { teamId } });
  }
}

export const teamService = new TeamService();
