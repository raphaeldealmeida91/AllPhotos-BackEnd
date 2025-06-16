import sharp from "sharp";
import logger from "../utils/logger.js";
import supabase from "../utils/supabaseClient.js";

export default async function PostImagesInFolder(request, reply) {
  try {
    const folderParam = request.params.folder;
    const folder = folderParam.trim().replace(/[^a-zA-Z0-9_-]/g, "_");

    const parts = request.parts();
    const uploadedFiles = [];

    for await (const part of parts) {
      if (part.file) {
        if (!part.mimetype.startsWith("image/")) {
          return reply.code(400).send({
            success: false,
            message: `Fichier non autorisé : ${part.filename}. Seules les images sont acceptées.`,
          });
        }
        const buffer = await part.toBuffer();
        const fileName = part.filename
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9.-]/g, "");

        const compressedBuffer = await sharp(buffer)
          .webp({ quality: 80 })
          .toBuffer();

        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
          .from("all-photos")
          .upload(filePath, compressedBuffer, {
            contentType: "image/webp",
          });

        if (error) {
          return reply
            .code(500)
            .send({ success: false, message: error.message });
        }

        uploadedFiles.push({ path: data.path });
      }
    }

    return reply.code(200).send({
      success: true,
      message: "Les images ont été téléchargé avec succès !",
      uploadedFiles: uploadedFiles.length,
    });
  } catch (err) {
    logger.error("Erreur lors du téléchargement des images :", err);
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
