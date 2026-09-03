import { projectSelectHandler } from "../features/projectHelper/project-select-menu-handler.js";
import { linkProjectSelectHandler } from "../features/projectHelper/links/link-project-select-menu-handler.js";
import { projectLinkSelectHandler } from "../features/projectHelper/links/link-select-menu-handler.js";
import { handleClockInSelects } from "../features/sessions/handle-clock-in-interactions.js";
import { handleMyDashboardSelects } from "../features/sessions/handle-my-dashboard-select.js";
import { handleTaskSelects } from "../features/tasks/handlers/selects/index.js";

export const selectHandlers = {
  project_select: {
    run: projectSelectHandler,
    context: { needsUser: true, needsSession: false },
  },
  link_project_select: {
    run: linkProjectSelectHandler,
    context: { needsUser: true, needsSession: false },
  },
  project_links_select: {
    run: projectLinkSelectHandler,
    context: { needsUser: true, needsSession: false },
  },
  clock_in: {
    run: handleClockInSelects,
    context: { needsUser: true, needsSession: false },
  },
  my_dashboard: {
    run: handleMyDashboardSelects,
    context: { needsUser: true, needsSession: false },
  },
  tasks: {
    run: handleTaskSelects,
    context: { needsUser: true, needsSession: false },
  },
};
