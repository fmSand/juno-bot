export default class ProjectService {
  constructor(db) {
    this.client = db.sequelize;
    this.Project = db.Project;
    this.User = db.User;
    this.ProjectMember = db.ProjectMember;
    this.Link = db.Link;
  }

  // CREATE PROJECT
  async create({ name, description, status = "active", ownerId }) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Project name is required and must be a non-empty string.");
    }
    if (!ownerId) {
      throw new Error("ownerId is required.");
    }

    return await this.client.transaction(async (transaction) => {
      const project = await this.Project.create({ name, description, status }, { transaction });

      await this.ProjectMember.create(
        {
          projectId: project.id,
          userId: ownerId,
          isAdmin: true,
          canAddLinks: true,
        },
        { transaction },
      );

      return this.getById(project.id, { transaction });
    });
  }

  // READ
  async getById(id, options = {}) {
    return this.Project.findByPk(id, {
      include: [
        { model: this.ProjectMember, as: "projectMembers" },
        { model: this.Link, as: "links" },
      ],
      ...options,
    });
  }

  async listActive() {
    return this.Project.findAll({
      where: { status: "active" },
      include: [
        {
          model: this.ProjectMember,
          as: "projectMembers",
          include: [
            {
              model: this.User,
              as: "user",
              attributes: ["id", "name", "discordId"],
            },
          ],
        },
        {
          model: this.Link,
          as: "links",
          attributes: ["id", "kind", "url", "description"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
  }

  async listByUser(userId, where = {}) {
    return this.Project.findAll({
      where,
      include: [
        {
          model: this.ProjectMember,
          as: "projectMembers",
          where: { userId },
        },
        {
          model: this.Link,
          as: "links",
          attributes: ["id", "kind", "url", "description"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
  }

  // UPDATE
  async update({ id, userId, args }) {
    const project = await this.Project.findOne({
      where: { id },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");

    const member = project.projectMembers.find((m) => m.userId === userId);
    if (!member) throw new Error("You are not a member of this project.");
    if (!member.isAdmin && !member.permissions?.canEdit)
      throw new Error("You don't have permission to edit this project.");

    // Only allow specific fields to be updated
    const allowedFields = ["name", "description", "status"];
    const updateData = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(args, key)) {
        updateData[key] = args[key];
      }
    }
    await this.Project.update(updateData, { where: { id } });
    return this.Project.findByPk(id, {
      include: [
        { model: this.ProjectMember, as: "projectMembers" },
        { model: this.Link, as: "links" },
      ],
    });
  }

  // HARD DELETE
  async delete({ id, userId }) {
    return this.client.transaction(async (t) => {
      const project = await this.Project.findOne({
        where: { id },
        include: [{ model: this.ProjectMember, as: "projectMembers" }],
        transaction: t,
      });

      if (!project) throw new Error("Project not found.");

      const member = project.projectMembers.find((m) => m.userId === userId);
      if (!member?.isAdmin) throw new Error("You don't have permission to delete this project.");

      await this.ProjectMember.destroy({ where: { projectId: id }, transaction: t });
      await this.Link.destroy({ where: { projectId: id }, transaction: t });
      await project.destroy({ transaction: t });

      return true;
    });
  }

  // DELETE (soft delete / archive)
  async archive({ id, userId }) {
    const project = await this.Project.findOne({
      where: { id },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");
    if (project.status === "archived") return project;
    const member = project.projectMembers.find((m) => m.userId === userId);
    if (!member?.isAdmin) throw new Error("You don't have permission to archive this project.");

    await this.Project.update({ status: "archived" }, { where: { id } });
    return this.Project.findByPk(id, {
      include: [
        { model: this.ProjectMember, as: "projectMembers" },
        { model: this.Link, as: "links" },
      ],
    });
  }

  async restore({ id, userId }) {
    const project = await this.Project.findOne({
      where: { id },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");
    if (project.status === "active") return project;

    const member = project.projectMembers.find((m) => m.userId === userId);
    if (!member?.isAdmin) throw new Error("You don't have permission to restore this project.");

    await this.Project.update({ status: "active" }, { where: { id } });
    return this.getById(id);
  }

  // PROJECT MEMBERS
  async addMember({ projectId, userId, addedBy }) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new Error("User not found.");
    const project = await this.Project.findOne({
      where: { id: projectId },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");

    const member = project.projectMembers.find((m) => m.userId === addedBy);
    if (!member?.isAdmin) throw new Error("You don't have permission to add members.");

    const existing = project.projectMembers.find((m) => m.userId === userId);
    if (existing) throw new Error("User is already a member.");

    await this.ProjectMember.create({
      projectId,
      userId,
      isAdmin: false,
      canAddLinks: false,
    });

    return this.getById(projectId);
  }

  async removeMember({ projectId, userId, removedBy }) {
    const project = await this.Project.findOne({
      where: { id: projectId },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");

    const member = project.projectMembers.find((m) => m.userId === removedBy);
    if (!member?.isAdmin) throw new Error("You don't have permission to remove members.");
    // Prevent removing the last admin
    const toRemove = project.projectMembers.find((m) => m.userId === userId);
    if (!toRemove) throw new Error("User not found in project.");
    if (toRemove.isAdmin) {
      const adminCount = project.projectMembers.filter((m) => m.isAdmin).length;
      if (adminCount <= 1) {
        throw new Error("Cannot remove the last admin from the project.");
      }
    }
    await this.ProjectMember.destroy({ where: { projectId, userId } });
    return this.getById(projectId);
  }

  async setPermissions({ projectId, targetId, editorId, perms }) {
    const project = await this.Project.findOne({
      where: { id: projectId },
      include: [{ model: this.ProjectMember, as: "projectMembers" }],
    });
    if (!project) throw new Error("Project not found.");

    const editor = project.projectMembers.find((m) => m.userId === editorId);
    if (!editor?.isAdmin) throw new Error("You don't have permission to edit member roles.");

    const target = project.projectMembers.find((m) => m.userId === targetId);
    if (!target) throw new Error("User not found in project.");

    const allowedFields = ["isAdmin", "canAddLinks"];
    const safePerms = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(perms, key)) {
        safePerms[key] = perms[key];
      }
    }
    await this.ProjectMember.update(safePerms, {
      where: { projectId, userId: targetId },
    });

    return this.getById(projectId);
  }
}
