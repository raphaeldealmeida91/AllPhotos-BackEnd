export default function generateWatermarkSVG(
  width,
  height,
  text = "allphotos"
) {
  const spacing = 200;
  const fontSize = 40;
  const positions = [];

  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      positions.push(
        `<text x="${x}" y="${y}" class="watermark">${text}</text>`
      );
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark {
          font-size: ${fontSize}px;
          font-weight: bold;
          fill: #000;
        }
      </style>
      ${positions.join("\n")}
    </svg>
  `;
}
