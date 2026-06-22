import { PageSizes, rgb } from 'pdf-lib';
import type { RenderContext } from '../certificate';
import { formatDateRu } from '../certificate';

export async function renderClassicPink(ctx: RenderContext) {
  const { pdf, fonts, data, settings, assets } = ctx;
  const { regular, bold } = fonts;

  const [w, h] = PageSizes.A4;
  const PAGE_W = h; // 842 (landscape)
  const PAGE_H = w; // 595
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  const colorBrand = rgb(219 / 255, 39 / 255, 119 / 255);
  const colorBrandSoft = rgb(252 / 255, 231 / 255, 243 / 255);
  const colorInk = rgb(24 / 255, 24 / 255, 27 / 255);
  const colorMuted = rgb(82 / 255, 82 / 255, 91 / 255);
  const colorLight = rgb(212 / 255, 212 / 255, 216 / 255);

  // Фон
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 80,
    width: PAGE_W,
    height: 80,
    color: colorBrandSoft,
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: 60,
    color: colorBrandSoft,
  });

  // Двойная рамка
  page.drawRectangle({
    x: 22,
    y: 22,
    width: PAGE_W - 44,
    height: PAGE_H - 44,
    borderColor: colorBrand,
    borderWidth: 4,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: PAGE_W - 72,
    height: PAGE_H - 72,
    borderColor: colorLight,
    borderWidth: 1,
  });

  // Лого (если есть) или медалька
  const medalCx = PAGE_W / 2;
  const medalCy = PAGE_H - 90;
  if (assets.logo) {
    const targetH = 56;
    const ratio = assets.logo.width / assets.logo.height;
    const targetW = targetH * ratio;
    page.drawImage(assets.logo, {
      x: medalCx - targetW / 2,
      y: medalCy - targetH / 2,
      width: targetW,
      height: targetH,
    });
  } else {
    page.drawCircle({ x: medalCx, y: medalCy, size: 26, color: colorBrand });
    page.drawCircle({ x: medalCx, y: medalCy, size: 20, color: rgb(1, 1, 1) });
    page.drawCircle({ x: medalCx, y: medalCy, size: 6, color: colorBrand });
    const ribbonY = medalCy - 24;
    page.drawLine({
      start: { x: medalCx - 18, y: ribbonY },
      end: { x: medalCx - 32, y: ribbonY - 24 },
      thickness: 6,
      color: colorBrand,
    });
    page.drawLine({
      start: { x: medalCx + 18, y: ribbonY },
      end: { x: medalCx + 32, y: ribbonY - 24 },
      thickness: 6,
      color: colorBrand,
    });
  }

  // Заголовок
  const titleSize = 48;
  const tw = bold.widthOfTextAtSize(settings.titleText, titleSize);
  page.drawText(settings.titleText, {
    x: (PAGE_W - tw) / 2,
    y: PAGE_H - 200,
    size: titleSize,
    font: bold,
    color: colorInk,
  });
  const subSize = 14;
  const sw = regular.widthOfTextAtSize(settings.subtitleText, subSize);
  page.drawText(settings.subtitleText, {
    x: (PAGE_W - sw) / 2,
    y: PAGE_H - 230,
    size: subSize,
    font: regular,
    color: colorMuted,
  });
  page.drawLine({
    start: { x: PAGE_W / 2 - 60, y: PAGE_H - 250 },
    end: { x: PAGE_W / 2 + 60, y: PAGE_H - 250 },
    thickness: 1,
    color: colorBrand,
  });

  // Имя
  const introSize = 13;
  const iw = regular.widthOfTextAtSize(settings.introText, introSize);
  page.drawText(settings.introText, {
    x: (PAGE_W - iw) / 2,
    y: PAGE_H - 285,
    size: introSize,
    font: regular,
    color: colorMuted,
  });

  let nameSize = 36;
  let nameW = bold.widthOfTextAtSize(data.recipientName, nameSize);
  const maxNameW = PAGE_W - 200;
  while (nameW > maxNameW && nameSize > 18) {
    nameSize -= 2;
    nameW = bold.widthOfTextAtSize(data.recipientName, nameSize);
  }
  page.drawText(data.recipientName, {
    x: (PAGE_W - nameW) / 2,
    y: PAGE_H - 335,
    size: nameSize,
    font: bold,
    color: colorBrand,
  });
  page.drawLine({
    start: { x: PAGE_W / 2 - nameW / 2 - 20, y: PAGE_H - 345 },
    end: { x: PAGE_W / 2 + nameW / 2 + 20, y: PAGE_H - 345 },
    thickness: 0.5,
    color: colorLight,
  });

  // Курс
  const cw = regular.widthOfTextAtSize(settings.completedText, introSize);
  page.drawText(settings.completedText, {
    x: (PAGE_W - cw) / 2,
    y: PAGE_H - 380,
    size: introSize,
    font: regular,
    color: colorMuted,
  });

  let courseSize = 20;
  const courseQuoted = `«${data.courseTitle}»`;
  let courseW = bold.widthOfTextAtSize(courseQuoted, courseSize);
  while (courseW > maxNameW && courseSize > 12) {
    courseSize -= 1;
    courseW = bold.widthOfTextAtSize(courseQuoted, courseSize);
  }
  page.drawText(courseQuoted, {
    x: (PAGE_W - courseW) / 2,
    y: PAGE_H - 410,
    size: courseSize,
    font: bold,
    color: colorInk,
  });

  // Подпись (если есть)
  if (assets.signature) {
    const targetH = 44;
    const ratio = assets.signature.width / assets.signature.height;
    const targetW = targetH * ratio;
    page.drawImage(assets.signature, {
      x: PAGE_W / 2 - targetW / 2,
      y: 130,
      width: targetW,
      height: targetH,
    });
    page.drawLine({
      start: { x: PAGE_W / 2 - 100, y: 124 },
      end: { x: PAGE_W / 2 + 100, y: 124 },
      thickness: 0.5,
      color: colorLight,
    });
    if (settings.instructorName) {
      const instSize = 10;
      const instW = regular.widthOfTextAtSize(
        settings.instructorName,
        instSize,
      );
      page.drawText(settings.instructorName, {
        x: (PAGE_W - instW) / 2,
        y: 110,
        size: instSize,
        font: regular,
        color: colorMuted,
      });
    }
  }

  // Низ: дата (слева), бренд (справа), QR (если есть)
  const baseY = 80;

  // Дата
  page.drawText('Дата выдачи', {
    x: 80,
    y: baseY + 14,
    size: 9,
    font: regular,
    color: colorMuted,
  });
  page.drawText(formatDateRu(data.completedAt), {
    x: 80,
    y: baseY,
    size: 12,
    font: bold,
    color: colorInk,
  });
  page.drawLine({
    start: { x: 80, y: baseY - 5 },
    end: { x: 230, y: baseY - 5 },
    thickness: 0.5,
    color: colorLight,
  });

  // QR (если есть) — над брендом справа
  let brandRightX = PAGE_W - 80;
  if (assets.qr) {
    const qrSize = 60;
    page.drawImage(assets.qr, {
      x: PAGE_W - 80 - qrSize,
      y: baseY - 8,
      width: qrSize,
      height: qrSize,
    });
    brandRightX = PAGE_W - 80 - qrSize - 12;
  }

  const brandSize = 14;
  const brandW = bold.widthOfTextAtSize(settings.brandName, brandSize);
  page.drawText(settings.brandName, {
    x: brandRightX - brandW,
    y: baseY,
    size: brandSize,
    font: bold,
    color: colorBrand,
  });
  const brandSubSize = 9;
  const brandSubW = regular.widthOfTextAtSize(
    settings.brandSubtitle,
    brandSubSize,
  );
  page.drawText(settings.brandSubtitle, {
    x: brandRightX - brandSubW,
    y: baseY + 14,
    size: brandSubSize,
    font: regular,
    color: colorMuted,
  });

  // ID
  const idText = `№ ${data.certificateId}`;
  const idSize = 8;
  const idW = regular.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: (PAGE_W - idW) / 2,
    y: 30,
    size: idSize,
    font: regular,
    color: colorMuted,
  });
}
