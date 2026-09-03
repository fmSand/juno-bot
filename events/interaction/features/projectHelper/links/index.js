import { projectLinkManager } from "./project-links.js";
import { projectEditLinkModal } from "./project-link-edit-modal.js";
import { projectLinkDeleteConfirmation } from "./project-links-delete.js";
import { projectLinkDeleteCancelHandler } from "./project-link-cancel-delete-handler.js";
import { projectLinkDeleteConfirmHandler } from "./project-link-confirm-delete-handler.js";
import { projectCreateLinkModal } from "./project-link-create-modal.js";

export const projectLinkButtonHandlers = {
  project_links: {
    run: projectLinkManager,
    context: { needsUser: true, needsSession: false },
  },
  project_link_create: {
    run: projectCreateLinkModal,
    context: { needsUser: true, needsSession: false },
  },
  project_link_edit: {
    run: projectEditLinkModal,
    context: { needsUser: true, needsSession: false },
  },
  project_link_delete: {
    run: projectLinkDeleteConfirmation,
    context: { needsUser: true, needsSession: false },
  },
  cancel_project_link_delete: {
    run: projectLinkDeleteCancelHandler,
    context: { needsUser: true, needsSession: false },
  },
  confirm_project_link_delete: {
    run: projectLinkDeleteConfirmHandler,
    context: { needsUser: true, needsSession: false },
  },
};
