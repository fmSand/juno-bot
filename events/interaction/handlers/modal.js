import { handleCreateUserModal } from "../features/users/handle-user-modal.js";
import { handleProjectCreateModal } from "../features/projectHelper/project-create-modal-handler.js";
import { handleProjectLinkCreateModal } from "../features/projectHelper/links/project-link-create-modal-handler.js";
import { handleProjectEditModal } from "../features/projectHelper/project-edit-modal-handler.js";
import { handleClockInModals } from "../features/sessions/handle-clock-in-interactions.js";
import { handleTaskModals } from "../features/tasks/handlers/modals/index.js";
import { handleProjectLinkEditModal } from "../features/projectHelper/links/project-link-edit-modal-handle.js";

export const modalSubmitHandlers = {
  create_user_modal: {
    run: handleCreateUserModal,
    context: { needsUser: true, needsSession: false },
  },
  create_project_modal: {
    run: handleProjectCreateModal,
    context: { needsUser: true, needsSession: false },
  },
  create_project_link_modal: {
    run: handleProjectLinkCreateModal,
    context: { needsUser: true, needsSession: false },
  },
  edit_project_modal: {
    run: handleProjectEditModal,
    context: { needsUser: true, needsSession: false },
  },
  edit_project_link_modal: {
    run: handleProjectLinkEditModal,
    context: { needsUser: true, needsSession: false },
  },
  clock_in: {
    run: handleClockInModals,
    context: { needsUser: true, needsSession: false },
  },
  tasks: {
    run: handleTaskModals,
    context: { needsUser: true, needsSession: false },
  },
};
