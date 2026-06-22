import { PageSizes, rgb } from 'pdf-lib';
import type { RenderContext } from '../certificate';
import { formatDateRu } from '../certificate';

/**
 * Премиум-шаблон: тёмно-синий фон + золотые акценты, белый текст.
 */
export async function renderGoldElegant(ctx: RenderContext) {
  const { pdf, fonts, data, settings, assets } = ctx;
  const { regular, bold } = fonts;

  const [w, h] = PageSizes.A4;
  const PAGE_W = h;
  const PAGE_H = w;
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  // Палитра
  const colorBg = rgb(15 / 255, 23 / 255, 42 / 255); // navy-900
  const colorBgSoft = rgb(30 / 255, 41 / 255, 70 / 255); // navy-800
  const colorGold = rgb(217 / 255, 168 / 255, 78 / 255); // gold
  const colorGoldSoft = rgb(180 / 255, 134 / 255, 53 / 255);
  const colorWhite = rgb(1, 1, 1);
  const colorWhiteSoft = rgb(203 / 255, 213 / 255, 225 / 255);

  // Тёмный фон
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: colorBg,
  });

  // Декоративный градиент-блок сверху (имитируем плашкой)
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 110,
    width: PAGE_W,
    height: 110,
    color: colorBgSoft,
  });

  // Золотая рамка (внешняя)
  page.drawRectangle({
    x: 30,
    y: 30,
    width: PAGE_W - 60,
    height: PAGE_H - 60,
    borderColor: colorGold,
    borderWidth: 2,
  });

  // Угловые декорации — линии в углах
  const cornerLen = 40;
  const cornerInset = 50;
  // Левый верхний
  page.drawLine({
    start: { x: cornerInset, y: PAGE_H - cornerInset - cornerLen },
    end: { x: cornerInset, y: PAGE_H - cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  page.drawLine({
    start: { x: cornerInset, y: PAGE_H - cornerInset },
    end: { x: cornerInset + cornerLen, y: PAGE_H - cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  // Правый верхний
  page.drawLine({
    start: { x: PAGE_W - cornerInset, y: PAGE_H - cornerInset - cornerLen },
    end: { x: PAGE_W - cornerInset, y: PAGE_H - cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  page.drawLine({
    start: { x: PAGE_W - cornerInset, y: PAGE_H - cornerInset },
    end: { x: PAGE_W - cornerInset - cornerLen, y: PAGE_H - cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  // Левый нижний
  page.drawLine({
    start: { x: cornerInset, y: cornerInset + cornerLen },
    end: { x: cornerInset, y: cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  page.drawLine({
    start: { x: cornerInset, y: cornerInset },
    end: { x: cornerInset + cornerLen, y: cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  // Правый нижний
  page.drawLine({
    start: { x: PAGE_W - cornerInset, y: cornerInset + cornerLen },
    end: { x: PAGE_W - cornerInset, y: cornerInset },
    thickness: 1.5,
    color: colorGold,
  });
  page.drawLine({
    start: { x: PAGE_W - cornerInset, y: cornerInset },
    end: { x: PAGE_W - cornerInset - cornerLen, y: cornerInset },
    thickness: 1.5,
    color: colorGold,
  });

  // Лого/медалька
  const medalCx = PAGE_W / 2;
  const medalCy = PAGE_H - 80;
  if (assets.logo) {
    const targetH = 50;
    const ratio = assets.logo.width / assets.logo.height;
    const targetW = targetH * ratio;
    page.drawImage(assets.logo, {
      x: medalCx - targetW / 2,
      y: medalCy - targetH / 2,
      width: targetW,
      height: targetH,
    });
  } else {
    // Золотое кольцо со звездой
    page.drawCircle({ x: medalCx, y: medalCy, size: 22, color: colorGold });
    page.drawCircle({ x: medalCx, y: medalCy, size: 16, color: colorBg });
    // 4-конечная звёздочка через линии
    page.drawLine({
      start: { x: medalCx, y: medalCy - 10 },
      end: { x: medalCx, y: medalCy + 10 },
      thickness: 2,
      color: colorGold,
    });
    page.drawLine({
      start: { x: medalCx - 10, y: medalCy },
      end: { x: medalCx + 10, y: medalCy },
      thickness: 2,
      color: colorGold,
    });
  }

  // Заголовок
  const titleSize = 44;
  const tw = bold.widthOfTextAtSize(settings.titleText, titleSize);
  page.drawText(settings.titleText, {
    x: (PAGE_W - tw) / 2,
    y: PAGE_H - 180,
    size: titleSize,
    font: bold,
    color: colorWhite,
  });

  // Подзаголовок
  const subSize = 12;
  const sw = regular.widthOfTextAtSize(settings.subtitleText, subSize);
  page.drawText(settings.subtitleText, {
    x: (PAGE_W - sw) / 2,
    y: PAGE_H - 210,
    size: subSize,
    font: regular,
    color: colorGold,
  });

  // Декоративная линия с точкой посередине
  const lineY = PAGE_H - 232;
  page.drawLine({
    start: { x: PAGE_W / 2 - 80, y: lineY },
    end: { x: PAGE_W / 2 - 8, y: lineY },
    thickness: 0.8,
    color: colorGold,
  });
  page.drawLine({
    start: { x: PAGE_W / 2 + 8, y: lineY },
    end: { x: PAGE_W / 2 + 80, y: lineY },
    thickness: 0.8,
    color: colorGold,
  });
  page.drawCircle({
    x: PAGE_W / 2,
    y: lineY,
    size: 3,
    color: colorGold,
  });

  // Имя
  const introSize = 11;
  const iw = regular.widthOfTextAtSize(settings.introText, introSize);
  page.drawText(settings.introText, {
    x: (PAGE_W - iw) / 2,
    y: PAGE_H - 270,
    size: introSize,
    font: regular,
    color: colorWhiteSoft,
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
    y: PAGE_H - 320,
    size: nameSize,
    font: bold,
    color: colorGold,
  });

  // Курс
  const completedW = regular.widthOfTextAtSize(
    settings.completedText,
    introSize,
  );
  page.drawText(settings.completedText, {
    x: (PAGE_W - completedW) / 2,
    y: PAGE_H - 360,
    size: introSize,
    font: regular,
    color: colorWhiteSoft,
  });

  let courseSize = 18;
  const courseQuoted = `«${data.courseTitle}»`;
  let courseW = bold.widthOfTextAtSize(courseQuoted, courseSize);
  while (courseW > maxNameW && courseSize > 12) {
    courseSize -= 1;
    courseW = bold.widthOfTextAtSize(courseQuoted, courseSize);
  }
  page.drawText(courseQuoted, {
    x: (PAGE_W - courseW) / 2,
    y: PAGE_H - 390,
    size: courseSize,
    font: bold,
    color: colorWhite,
  });

  // Низ: подпись слева, дата по центру, QR справа
  const baseY = 100;

  // Подпись
  if (assets.signature) {
    const sigH = 40;
    const ratio = assets.signature.width / assets.signature.height;
    page.drawImage(assets.signature, {
      x: 80,
      y: baseY,
      width: sigH * ratio,
      height: sigH,
    });
  }
  page.drawLine({
    start: { x: 80, y: baseY - 5 },
    end: { x: 230, y: baseY - 5 },
    thickness: 0.5,
    color: colorGoldSoft,
  });
  page.drawText('Преподаватель', {
    x: 80,
    y: baseY - 18,
    size: 8,
    font: regular,
    color: colorWhiteSoft,
  });
  if (settings.instructorName) {
    page.drawText(settings.instructorName, {
      x: 80,
      y: baseY - 32,
      size: 10,
      font: bold,
      color: colorGold,
    });
  }

  // Дата по центру
  const dateLabel = 'Дата выдачи';
  const dlW = regular.widthOfTextAtSize(dateLabel, 8);
  page.drawText(dateLabel, {
    x: (PAGE_W - dlW) / 2,
    y: baseY + 14,
    size: 8,
    font: regular,
    color: colorWhiteSoft,
  });
  const dateText = formatDateRu(data.completedAt);
  const dateW = bold.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: (PAGE_W - dateW) / 2,
    y: baseY,
    size: 11,
    font: bold,
    color: colorWhite,
  });

  // QR справа
  if (assets.qr) {
    const qrSize = 56;
    // Белая подложка под QR (чтобы был видим на тёмном фоне)
    page.drawRectangle({
      x: PAGE_W - 80 - qrSize - 4,
      y: baseY - 14,
      width: qrSize + 8,
      height: qrSize + 8,
      color: colorWhite,
    });
    page.drawImage(assets.qr, {
      x: PAGE_W - 80 - qrSize,
      y: baseY - 10,
      width: qrSize,
      height: qrSize,
    });
  } else {
    const brW = bold.widthOfTextAtSize(settings.brandName, 12);
    page.drawText(settings.brandName, {
      x: PAGE_W - 80 - brW,
      y: baseY,
      size: 12,
      font: bold,
      color: colorGold,
    });
    page.drawText(settings.brandSubtitle, {
      x: PAGE_W - 80 - regular.widthOfTextAtSize(settings.brandSubtitle, 9),
      y: baseY + 14,
      size: 9,
      font: regular,
      color: colorWhiteSoft,
    });
  }

  // ID
  const idText = `№ ${data.certificateId}`;
  const idSize = 8;
  const idW = regular.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: (PAGE_W - idW) / 2,
    y: 38,
    size: idSize,
    font: regular,
    color: colorGoldSoft,
  });
}
