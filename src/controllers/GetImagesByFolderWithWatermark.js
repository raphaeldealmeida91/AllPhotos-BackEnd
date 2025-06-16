import sharp from "sharp";
import axios from "axios";
import logger from "../utils/logger.js";
import supabase from "../utils/supabaseClient.js";
import generateWatermarkSVG from "../utils/watermark.js";

export default async function GetImagesByFolderWithWatermark(request, reply) {
  try {
    const folderParam = request.params.folder;

    const { data, error } = await supabase.storage
      .from("all-photos")
      .list(folderParam, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }

    const images = await Promise.all(
      data
        .filter((file) => !file.name.startsWith("."))
        .map(async (file) => {
          const { data: signedUrlData, error: signedError } =
            await supabase.storage
              .from("all-photos")
              .createSignedUrl(`${folderParam}/${file.name}`, 60 * 5);

          if (signedError) return null;

          const response = await axios.get(signedUrlData.signedUrl, {
            responseType: "arraybuffer",
          });

          const imageBuffer = Buffer.from(response.data);
          const metadata = await sharp(imageBuffer).metadata();

          const watermarkSVG = generateWatermarkSVG(
            metadata.width,
            metadata.height
          );

          const watermarkedBuffer = await sharp(imageBuffer)
            .composite([
              {
                input: Buffer.from(watermarkSVG),
                top: 0,
                left: 0,
              },
            ])
            .jpeg({ quality: 60 })
            .toBuffer();

          return {
            id: file.id,
            name: file.name,
            base64: `data:image/jpeg;base64,${watermarkedBuffer.toString(
              "base64"
            )}`,
          };
        })
    );

    const filteredImages = images.filter(Boolean);

    return reply.code(200).send({
      success: true,
      images: filteredImages,
    });
  } catch (err) {
    logger.error(
      "Erreur lors de la récupération des photos avec le watermark :"
    );
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
