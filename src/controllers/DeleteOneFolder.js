import logger from "../utils/logger.js";
import supabase from "../utils/supabaseClient.js";

export default async function DeleteOneFolder(request, reply) {
  const folder = request.params.folder;

  try {
    const { data: files, error: listError } = await supabase.storage
      .from("all-photos")
      .list(folder + "/", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
        search: "",
      });

    if (listError) {
      return reply.code(500).send({
        success: false,
        message: "Erreur lors de la récupération du dossier.",
      });
    }

    if (!files || files.length === 0) {
      return reply.send({
        success: true,
        message: "Dossier vide ou inexistant.",
      });
    }

    const pathsToDelete = files.map((file) => `${folder}/${file.name}`);

    const { error: deleteError } = await supabase.storage
      .from("all-photos")
      .remove(pathsToDelete);

    if (deleteError) {
      return reply.code(500).send({
        success: false,
        message: "Erreur lors de la suppression des fichiers.",
      });
    }

    return reply.send({
      success: true,
      message: `Le dossier "${folder}" et ses fichiers ont été supprimés.`,
    });
  } catch (err) {
    logger.error("Erreur lors de la suppression du dossier :");
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
