import logger from "../utils/logger.js";
import supabase from "../utils/supabaseClient.js";

export default async function GetAllFolders(request, reply) {
  try {
    const { data, error } = await supabase.storage.from("all-photos").list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }

    const folders = data
      .filter((item) => item.name && item.metadata === null)
      .map((item) => item.name);

    return reply.code(200).send({ success: true, folders });
  } catch (err) {
    logger.error("Erreur lors de la récupération des dossiers :");
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
