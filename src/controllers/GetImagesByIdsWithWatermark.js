import sharp from "sharp";
import axios from "axios";
import supabase from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";
import generateWatermarkSVG from "../utils/watermark.js";

export async function GetImagesByIdsWithWatermark(request, reply) {
  try {
    const pathImg = request.body.pathImg;

    if (!Array.isArray(pathImg) || pathImg.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "Le tableau de chemins des images est requis.",
      });
    }

    const images = await Promise.all(
      pathImg.map(async (onePathImg) => {
        const { data: signedUrlData, error: signedError } =
          await supabase.storage
            .from("all-photos")
            .createSignedUrl(onePathImg, 60 * 5);

        if (signedError) {
          logger.error(
            `Erreur création URL signée pour ${filename}: ${signedError.message}`
          );
          return null;
        }

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
          .composite([{ input: Buffer.from(watermarkSVG), top: 0, left: 0 }])
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
    logger.error("Erreur lors de la récupération des images :");
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
