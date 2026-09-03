export async function appendContext(interaction, contextConfig = {}) {
  if (!contextConfig) return;

  const { needsUser = false, needsSession = false } = contextConfig;

  interaction.botContext = interaction.botContext || {};

  if (needsUser && !interaction.botContext.user) {
    const user = await interaction.services.userService.getOneDiscordId(interaction.user.id);

    if (!user) {
      interaction.botContext.user = null;
      // no user no session or any other context to be had.
      return;
    }

    interaction.botContext.user = user;
  }

  // Load session if needed
  if (needsSession && interaction.botContext.user && !interaction.botContext.session) {
    const session = await interaction.services.sessionService.getOneActive(
      interaction.botContext.user.id,
    );
    interaction.botContext.session = session || null;
  }
}
