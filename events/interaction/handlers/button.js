import { handleCreateUserButton } from "../features/users/create-user-modal.js";
import { handleClockInButton } from "../features/sessions/handle-clock-in-button.js";
import { handleClockingInButtons } from "../features/sessions/handle-clock-in-interactions.js";
import { handleClockOutButton } from "../features/sessions/handle-clock-out-button.js";
import { handleTimerButtons } from "../features/sessions/handle-timer-buttons.js";
import { handleTaskButtons } from "../features/tasks/handlers/buttons/index.js";
import { projectCreateModal } from "../features/projectHelper/project-create-modal.js";
import { projectDeleteConfirmation } from "../features/projectHelper/project-delete.js";
import { projectDeleteCancelHandler } from "../features/projectHelper/project-cancel-delete-handler.js";
import { projectDeleteConfirmHandler } from "../features/projectHelper/project-confirm-delete-handler.js";
import { projectArchiveHandler } from "../features/projectHelper/project-archive-handler.js";
import { projectRestoreHandler } from "../features/projectHelper/project-restore-handler.js";
import { projectEditModal } from "../features/projectHelper/project-edit-modal.js";
import { projectLinkButtonHandlers } from "../features/projectHelper/links/index.js";
import { handleDashboardButtons } from "../features/liveDashboard/handle-dashboard-buttons.js";

export const buttonHandlers = {
  create_user_modal_button: {
    run: handleCreateUserButton,
    context: { needsUser: true, needsSession: false },
  },
  clock_in_button: {
    run: handleClockInButton,
    context: { needsUser: true, needsSession: false },
  },
  clock_out_button: {
    run: handleClockOutButton,
    context: { needsUser: true, needsSession: true },
  },
  clock_in: {
    run: handleClockingInButtons,
    context: { needsUser: true, needsSession: false },
  },
  timer: {
    run: handleTimerButtons,
    context: { needsUser: true, needsSession: false },
  },
  tasks: {
    run: handleTaskButtons,
    context: { needsUser: true, needsSession: false },
  },
  project_create: {
    run: projectCreateModal,
    context: { needsUser: true, needsSession: false },
  },
  project_delete: {
    run: projectDeleteConfirmation,
    context: { needsUser: true, needsSession: false },
  },
  cancel_project_delete: {
    run: projectDeleteCancelHandler,
    context: { needsUser: true, needsSession: false },
  },
  confirm_project_delete: {
    run: projectDeleteConfirmHandler,
    context: { needsUser: true, needsSession: false },
  },
  project_archive: {
    run: projectArchiveHandler,
    context: { needsUser: true, needsSession: false },
  },
  project_restore: {
    run: projectRestoreHandler,
    context: { needsUser: true, needsSession: false },
  },
  project_edit: {
    run: projectEditModal,
    context: { needsUser: true, needsSession: false },
  },
  ...projectLinkButtonHandlers,
  dashboard: {
    run: handleDashboardButtons,
    context: { needsUser: true, needsSession: true },
  },
};
