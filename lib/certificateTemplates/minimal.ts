import { PageSizes, rgb } from 'pdf-lib';
import type { RenderContext } from '../certificate';
import { formatDateRu } from '../certificate';

/**
 * Минималистичный белый шаблон.
 * Никаких рамок, фоновых заливок и медалек. Только типографика и тонкие линии.
 */
export async function renderMinimal(ctx: RenderContext) {
  const { pdf, fonts, data, settings, assets } = ctx;
  const { regular, bold } = fonts;

  const [w, h] = PageSizes.A4;
  const PAGE_W = h;
  const PAGE_H = w;
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  const colorInk = rgb(24 / 255, 24 / 255, 27 / 255);
  const colorMuted = rgb(113 / 255, 113 / 255, 122 / 255);
  const colorLine = rgb(229 / 255, 229 / 255, 234 / 255);
  const colorAccent = rgb(82 / 255, 82 / 255, 91 / 255);

  // Чистый белый фон
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(1, 1, 1),
  });

  // Шапка: тонкая линия + бренд + лого слева
  page.drawLine({
    start: { x: 70, y: PAGE_H - 56 },
    end: { x: PAGE_W - 70, y: PAGE_H - 56 },
    thickness: 0.5,
    color: colorLine,
  });

  if (assets.logo) {
    const targetH = 24;
    const ratio = assets.logo.width / assets.logo.height;
    page.drawImage(assets.logo, {
      x: 70,
      y: PAGE_H - 50,
      width: targetH * ratio,
      height: targetH,
    });
  } else {
    page.drawText(settings.brandName, {
      x: 70,
      y: PAGE_H - 42,
      size: 11,
      font: bold,
      color: colorInk,
    });
  }

  // ID справа сверху
  const idText = `${data.certificateId}`;
  const idSize = 9;
  const idW = regular.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: PAGE_W - 70 - idW,
    y: PAGE_H - 42,
    size: idSize,
    font: regular,
    color: colorMuted,
  });

  // Эйбро-заголовок
  const eyebrowText = settings.subtitleText.toUpperCase();
  const ebSize = 10;
  const ebW = bold.widthOfTextAtSize(eyebrowText, ebSize);
  page.drawText(eyebrowText, {
    x: (PAGE_W - ebW) / 2,
    y: PAGE_H - 130,
    size: ebSize,
    font: bold,
    color: colorAccent,
    // У pdf-lib нет letter-spacing, но визуально — тонкая жирность работает
  });

  // Заголовок крупно
  const titleSize = 64;
  const titleW = bold.widthOfTextAtSize(settings.titleText, titleSize);
  page.drawText(settings.titleText, {
    x: (PAGE_W - titleW) / 2,
    y: PAGE_H - 200,
    size: titleSize,
    font: bold,
    color: colorInk,
  });

  // Имя получателя — самое крупное на странице
  const introSize = 12;
  const iw = regular.widthOfTextAtSize(settings.introText, introSize);
  page.drawText(settings.introText, {
    x: (PAGE_W - iw) / 2,
    y: PAGE_H - 260,
    size: introSize,
    font: regular,
    color: colorMuted,
  });

  let nameSize = 44;
  let nameW = bold.widthOfTextAtSize(data.recipientName, nameSize);
  const maxNameW = PAGE_W - 180;
  while (nameW > maxNameW && nameSize > 22) {
    nameSize -= 2;
    nameW = bold.widthOfTextAtSize(data.recipientName, nameSize);
  }
  page.drawText(data.recipientName, {
    x: (PAGE_W - nameW) / 2,
    y: PAGE_H - 320,
    size: nameSize,
    font: bold,
    color: colorInk,
  });

  // Завершил курс
  const cw = regular.widthOfTextAtSize(settings.completedText, introSize);
  page.drawText(settings.completedText, {
    x: (PAGE_W - cw) / 2,
    y: PAGE_H - 360,
    size: introSize,
    font: regular,
    color: colorMuted,
  });

  let courseSize = 20;
  let courseW = bold.widthOfTextAtSize(data.courseTitle, courseSize);
  while (courseW > maxNameW && courseSize > 14) {
    courseSize -= 1;
    courseW = bold.widthOfTextAtSize(data.courseTitle, courseSize);
  }
  page.drawText(data.courseTitle, {
    x: (PAGE_W - courseW) / 2,
    y: PAGE_H - 390,
    size: courseSize,
    font: bold,
    color: colorAccent,
  });

  // Низ: подпись слева, дата по центру, QR справа
  const baseY = 100;

  // Линия-разделитель снизу
  page.drawLine({
    start: { x: 70, y: baseY + 60 },
    end: { x: PAGE_W - 70, y: baseY + 60 },
    thickness: 0.5,
    color: colorLine,
  });

  // Подпись
  if (assets.signature) {
    const sigH = 40;
    const sigRatio = assets.signature.width / assets.signature.height;
    page.drawImage(assets.signature, {
      x: 70,
      y: baseY,
      width: sigH * sigRatio,
      height: sigH,
    });
  }
  page.drawLine({
    start: { x: 70, y: baseY - 6 },
    end: { x: 230, y: baseY - 6 },
    thickness: 0.5,
    color: colorLine,
  });
  page.drawText('Преподаватель', {
    x: 70,
    y: baseY - 20,
    size: 8,
    font: regular,
    color: colorMuted,
  });
  if (settings.instructorName) {
    page.drawText(settings.instructorName, {
      x: 70,
      y: baseY - 34,
      size: 10,
      font: bold,
      color: colorInk,
    });
  }

  // Дата по центру
  page.drawText('Дата выдачи', {
    x: PAGE_W / 2 - 60,
    y: baseY - 6,
    size: 8,
    font: regular,
    color: colorMuted,
  });
  const dateText = formatDateRu(data.completedAt);
  const dateW = bold.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: (PAGE_W - dateW) / 2,
    y: baseY - 22,
    size: 11,
    font: bold,
    color: colorInk,
  });

  // QR справа
  if (assets.qr) {
    const qrSize = 60;
    page.drawImage(assets.qr, {
      x: PAGE_W - 70 - qrSize,
      y: baseY - 10,
      width: qrSize,
      height: qrSize,
    });
    page.drawText('Проверка', {
      x: PAGE_W - 70 - qrSize,
      y: baseY - 24,
      size: 7,
      font: regular,
      color: colorMuted,
    });
  } else {
    // Бренд справа если QR выключен
    const brW = bold.widthOfTextAtSize(settings.brandName, 11);
    page.drawText(settings.brandName, {
      x: PAGE_W - 70 - brW,
      y: baseY - 22,
      size: 11,
      font: bold,
      color: colorInk,
    });
    page.drawText(settings.brandSubtitle, {
      x: PAGE_W - 70 - regular.widthOfTextAtSize(settings.brandSubtitle, 8),
      y: baseY - 6,
      size: 8,
      font: regular,
      color: colorMuted,
    });
  }
}
