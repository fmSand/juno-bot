class ProjectMemberService {
  constructor({ Project, ProjectMember, User, sequelize }) {
    this.Project = Project;
    this.ProjectMember = ProjectMember;
    this.User = User;
    this.sequelize = sequelize;
  }

  async addMember({ projectId, addedByUserId, targetUserId, canAddLinks = false }) {
    return this.sequelize.transaction(async (t) => {
      await requireProject(this.Project, projectId, t);
      await requireAdmin(this.ProjectMember, projectId, addedByUserId, t);
      await requireUser(this.User, targetUserId, t);

      await requireNotAlreadyMember(this.ProjectMember, projectId, targetUserId, t);

      return this.ProjectMember.create(
        {
          projectId,
          userId: targetUserId,
          isAdmin: false,
          canAddLinks: Boolean(canAddLinks),
          permission: {},
        },
        { transaction: t },
      );
    });
  }

  async toggleAdmin({ projectId, toggledByUserId, targetUserId, value }) {
    return this.sequelize.transaction(async (t) => {
      await requireProject(this.Project, projectId, t);
      await requireAdmin(this.ProjectMember, projectId, toggledByUserId, t);

      const member = await requireMember(this.ProjectMember, projectId, targetUserId, t);

      const nextValue = typeof value === "boolean" ? value : !member.isAdmin;

      // Prevent project becoming adminless
      if (member.isAdmin === true && nextValue === false) {
        await requireMoreThanOneAdmin(this.ProjectMember, projectId, t);
      }

      member.isAdmin = nextValue;
      await member.save({ transaction: t });
      return member;
    });
  }

  async toggleCanAddLinks({ projectId, toggledByUserId, targetUserId, value }) {
    return this.sequelize.transaction(async (t) => {
      await requireProject(this.Project, projectId, t);
      await requireAdmin(this.ProjectMember, projectId, toggledByUserId, t);

      const member = await requireMember(this.ProjectMember, projectId, targetUserId, t);
      const nextValue = typeof value === "boolean" ? value : !member.canAddLinks;

      member.canAddLinks = nextValue;
      await member.save({ transaction: t });
      return member;
    });
  }

  async removeMember({ projectId, removedByUserId, targetUserId }) {
    return this.sequelize.transaction(async (t) => {
      await requireProject(this.Project, projectId, t);
      await requireAdmin(this.ProjectMember, projectId, removedByUserId, t);

      const member = await requireMember(this.ProjectMember, projectId, targetUserId, t);

      // Prevent removing the last admin
      if (member.isAdmin === true) {
        await requireMoreThanOneAdmin(this.ProjectMember, projectId, t);
      }

      await member.destroy({ transaction: t });
      return { removed: true };
    });
  }
}

module.exports = ProjectMemberService;

async function requireProject(Project, projectId, transaction) {
  const project = await Project.findByPk(projectId, { transaction });
  if (!project) throw new Error("Project not found");
  return project;
}

async function requireUser(User, userId, transaction) {
  const user = await User.findByPk(userId, { transaction });
  if (!user) throw new Error("User does not exist");
  return user;
}

async function requireAdmin(ProjectMember, projectId, userId, transaction) {
  const adminMember = await ProjectMember.findOne({
    where: { projectId, userId, isAdmin: true },
    transaction,
  });
  if (!adminMember) throw new Error("Only admins can perform this action");
  return adminMember;
}

async function requireMember(ProjectMember, projectId, userId, transaction) {
  const member = await ProjectMember.findOne({
    where: { projectId, userId },
    transaction,
  });
  if (!member) throw new Error("User is not a member of this project");
  return member;
}

async function requireNotAlreadyMember(ProjectMember, projectId, userId, transaction) {
  const existing = await ProjectMember.findOne({
    where: { projectId, userId },
    transaction,
  });
  if (existing) throw new Error("User is already a member");
}

async function requireMoreThanOneAdmin(ProjectMember, projectId, transaction) {
  const adminCount = await ProjectMember.count({
    where: { projectId, isAdmin: true },
    transaction,
  });
  if (adminCount <= 1) throw new Error("Cannot remove/demote the last admin");
}
