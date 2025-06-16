import logger from "../utils/logger.js";
import supabase from "../utils/supabaseClient.js";
import generateRandomToken from "../utils/Token.js";

export async function copyFileToFolder(request, reply) {
  const { pathImgs } = request.body;
  try {
    if (!Array.isArray(pathImgs)) {
      logger.error(
        "Les chemins des images doit être sous forme de chaîne de caractère dans un tableau !"
      );
      return { success: false };
    }
    const targetFolder = generateRandomToken();
    const uploadResults = [];

    for (const pathImg of pathImgs) {
      // 1. Créer signed URL pour télécharger le fichier source
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from("all-photos")
        .createSignedUrl(pathImg, 60 * 5);

      if (signedError) throw signedError;

      // 2. Télécharger le contenu via fetch
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error("Erreur téléchargement fichier source");
      const fileBlob = await response.blob();

      // 3. Construire nouveau chemin dans dossier cible
      const fileName = pathImg.split("/").pop();
      const newPath = `${targetFolder}/${fileName}`;

      // 4. Upload du fichier dans le dossier cible
      const { data, error: uploadError } = await supabase.storage
        .from("all-photos")
        .upload(newPath, fileBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      logger.info(`Fichier copié vers ${newPath}`);
      uploadResults.push({ newPath, data });
    }

    return { success: true, targetFolder, uploadResults };
  } catch (err) {
    logger.error("Erreur copie fichier :");
    logger.error({ err });
  }
}
