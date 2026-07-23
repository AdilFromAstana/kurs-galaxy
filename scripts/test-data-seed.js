const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  // 1. Админ Камила (хозяйка платформы — для её собственных будущих курсов)
  let camila = await p.admin.findUnique({ where: { email: 'kamila@nailacademy.kz' } });
  if (!camila) {
    const hash = await bcrypt.hash('Kamila2026!', 10);
    camila = await p.admin.create({
      data: { email: 'kamila@nailacademy.kz', name: 'Камила', passwordHash: hash, role: 'ADMIN' },
    });
    console.log('✓ Админ Камила создан: kamila@nailacademy.kz / Kamila2026!');
  } else {
    console.log('= Админ Камила уже есть');
  }

  // 1b. Тестовый автор-админ (владелец демо-курса «Курс маникюра Pro»)
  let demoAuthor = await p.admin.findUnique({ where: { email: 'demo-author@nailacademy.kz' } });
  if (!demoAuthor) {
    const hash = await bcrypt.hash('DemoAuthor2026!', 10);
    demoAuthor = await p.admin.create({
      data: {
        email: 'demo-author@nailacademy.kz',
        name: 'Демо Автор',
        passwordHash: hash,
        role: 'ADMIN',
      },
    });
    console.log('✓ Демо-автор создан: demo-author@nailacademy.kz / DemoAuthor2026!');
  } else {
    console.log('= Демо-автор уже есть');
  }

  // 2. Тестовый студент БЕЗ покупки (для проверки воронки регистрация→покупка)
  let testUser = await p.user.findUnique({ where: { email: 'test@nailacademy.kz' } });
  if (!testUser) {
    const hash = await bcrypt.hash('TestStudent1!', 10);
    testUser = await p.user.create({
      data: { email: 'test@nailacademy.kz', name: 'Тест Тестов', passwordHash: hash },
    });
    console.log('✓ Студент без покупки: test@nailacademy.kz / TestStudent1!');
  } else {
    console.log('= Студент test@... уже есть');
  }

  // 3. Студент С UNLIMITED покупкой (для проверки полного доступа к курсу)
  let demoUser = await p.user.findUnique({ where: { email: 'student@nailacademy.kz' } });
  if (!demoUser) {
    const hash = await bcrypt.hash('Student2026!', 10);
    demoUser = await p.user.create({
      data: { email: 'student@nailacademy.kz', name: 'Демо Студент', passwordHash: hash },
    });
    console.log('✓ Студент с покупкой: student@nailacademy.kz / Student2026!');
  } else {
    console.log('= Студент student@... уже есть');
  }

  // 4. Демо-курс по маникюру (автор — Демо Автор, НЕ Камила)
  const slug = 'manicure-pro-2026';
  let course = await p.course.findUnique({ where: { slug } });
  if (course) {
    // Перезаписываем автора на demoAuthor (если был привязан к кому-то ещё — поправим).
    if (course.creatorId !== demoAuthor.id) {
      course = await p.course.update({
        where: { id: course.id },
        data: { creatorId: demoAuthor.id },
      });
      console.log('✓ Курс перепривязан к Демо Автору');
    } else {
      console.log('= Курс уже создан, автор — Демо Автор');
    }
  } else {
    course = await p.course.create({
      data: {
        slug,
        title: 'Курс маникюра Pro: от новичка до мастера',
        description:
          'Полный практический курс по аппаратному маникюру и покрытию гель-лаком. Подходит как новичкам, так и опытным мастерам, желающим систематизировать знания. После прохождения вы сможете уверенно работать с любым типом ногтя, выполнять идеальную обработку кутикулы и качественное долговечное покрытие.',
        published: true,
        creatorId: demoAuthor.id,
      },
    });

    const modules = [
      {
        title: 'Модуль 1. Основы и подготовка к работе',
        description: 'Знакомство с профессией мастера. Инструменты, расходники, рабочее место.',
        lessons: [
          { title: 'Знакомство с инструментами', duration: '12:30', isFree: true, videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            content: '# Знакомство с инструментами\n\nВ этом уроке разберём весь базовый набор мастера маникюра:\n\n- **Аппарат для маникюра** — обороты, мощность, нюансы выбора\n- **Фрезы** — виды, материал (керамика, корунд, алмаз), назначение\n- **Пилки** — абразивность, форма, для чего используется каждая\n- **Кисти и палитры** для работы с гель-лаком\n\nПо итогу урока вы будете точно знать, что нужно купить для старта работы и сэкономите на ненужных покупках.' },
          { title: 'Санитарные нормы и стерилизация', duration: '18:45', isFree: true, videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            content: '# Санитарные нормы\n\nБезопасность клиента — приоритет №1. Мы пройдём:\n\n1. Этапы обработки инструмента: дезинфекция → ПСО → стерилизация\n2. Какие сухожары/автоклавы выбрать для дома и салона\n3. Чек-лист проверки рабочего места перед клиентом\n4. Как работать с одноразовыми расходниками\n\n**Важно:** соблюдение СанПиН — это не только про безопасность, но и про репутацию. Один случай инфекции — и мастер теряет клиентов навсегда.' },
          { title: 'Формы и архитектура ногтя', duration: '24:10', isFree: false, videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
            content: '# Архитектура ногтя\n\nКаждый ноготь уникален. В этом уроке учимся:\n\n- Определять тип ногтя клиента (квадрат, овал, миндаль, балерина, стилет)\n- Строить правильную архитектуру под выбранную форму\n- Корректировать форму при апексах и зонах напряжения\n- Работать с проблемными ногтями (тонкие, изогнутые, после онихолизиса)\n\n**Практика:** 5 разборов клиентских кейсов с фото "до/после".' },
        ],
      },
      {
        title: 'Модуль 2. Аппаратный маникюр',
        description: 'Технология сухого маникюра аппаратом. От первого касания до идеальной кутикулы.',
        lessons: [
          { title: 'Виды фрез и их применение', duration: '22:00', isFree: false, videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_10MB.mp4',
            content: '# Фрезы — главный инструмент мастера\n\nКаждой фрезе — своё место:\n\n- **Шар (керамика)** — поднятие птеригия\n- **Пламя (корунд)** — работа с боковыми валиками\n- **Цилиндр** — спил длины и подготовка пластины\n- **Конус** — финишная обработка\n\nРазбираем по шагам, какая абразивность нужна на каждом этапе и почему «одна фреза на всё» — путь к травмам клиента.' },
          { title: 'Техника снятия кутикулы', duration: '32:15', isFree: false, videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_10MB.mp4',
            content: '# Снятие кутикулы аппаратом\n\nПошаговый разбор техники «веером»:\n\n1. Поднятие птеригия керамическим шаром\n2. Работа в зоне боковых валиков\n3. Удаление кутикулы пламенем под углом 45°\n4. Финиш мягкой полировальной фрезой\n\nЧастые ошибки и как их избежать. Видео крупным планом с замедлением 0.5x.' },
          { title: 'Полировка и подготовка под покрытие', duration: '15:30', isFree: false, videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_10MB.mp4',
            content: '# Подготовка под гель-лак\n\nОт качества подготовки зависит стойкость покрытия. Учимся:\n\n- Бафить пластину **без перепиливания**\n- Снимать жирный слой и пылевой остаток\n- Обезжиривать дегидратором правильно\n- Когда нужен праймер кислотный, а когда — бескислотный' },
        ],
      },
      {
        title: 'Модуль 3. Гель-лак и дизайн',
        description: 'Покрытие, дизайн, фотографирование работ для портфолио.',
        lessons: [
          { title: 'Базы и топы — как выбрать', duration: '20:00', isFree: false, videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_10MB.mp4',
            content: '# Базы и топы\n\nОбзор популярных систем (Kodi, Patrisa Nail, Beautix, Komilfo):\n\n- Каучуковые базы — для тонких ногтей\n- Камуфляжные базы — для французского с эффектом ровного тона\n- Топы с/без липкого слоя — что когда использовать\n\nПосле урока вы сможете осознанно выбрать линейку под свой запрос и не покупать «всё подряд».' },
          { title: 'Аккуратное покрытие сложных форм', duration: '28:45', isFree: false, videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            content: '# Покрытие без затёков\n\nТехника «под кутикулу»:\n\n1. Тонкий выкладной слой базы\n2. Корректирующая база для архитектуры\n3. Цветной слой — два тонких прохода\n4. Топ с отступом 0.5 мм\n\nКак работать с проблемными ногтями: трещины, типсы, наращивание формой.' },
          { title: 'Простой дизайн градиентом', duration: '14:20', isFree: false, videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            content: '# Градиент за 5 минут\n\nНежный омбре-дизайн без сложного оборудования:\n\n- Спонж + 2 цвета гель-лака\n- Техника «перо» для мягкого перехода\n- Финишный топ с эффектом «стекло»\n\nВ конце урока — съёмка готовой работы для соцсетей.' },
        ],
      },
    ];

    let modOrder = 0;
    for (const m of modules) {
      const mod = await p.module.create({
        data: { courseId: course.id, title: m.title, description: m.description, order: modOrder++ },
      });
      let lesOrder = 0;
      for (const l of m.lessons) {
        await p.lesson.create({
          data: { moduleId: mod.id, title: l.title, duration: l.duration, isFree: l.isFree, videoUrl: l.videoUrl, content: l.content, order: lesOrder++ },
        });
      }
    }

    await p.pricingPlan.createMany({
      data: [
        { courseId: course.id, name: 'Базовый', description: 'Доступ ко всем урокам на 1 месяц', accessPeriod: 'ONE_MONTH', accessDays: 30, price: 18000, currency: 'KZT', isActive: true, isRecommended: false, order: 0 },
        { courseId: course.id, name: 'Стандарт', description: 'Доступ на 3 месяца — самый популярный', accessPeriod: 'THREE_MONTHS', accessDays: 90, price: 35000, currency: 'KZT', isActive: true, isRecommended: true, order: 1 },
        { courseId: course.id, name: 'Безлимит', description: 'Доступ навсегда + все будущие обновления курса', accessPeriod: 'UNLIMITED', accessDays: null, price: 65000, currency: 'KZT', isActive: true, isRecommended: false, order: 2 },
      ],
    });

    console.log('✓ Курс создан: ' + course.title);
  }

  // 5. UNLIMITED-покупка для demo-студента
  const unlimitedPlan = await p.pricingPlan.findFirst({
    where: { courseId: course.id, accessPeriod: 'UNLIMITED' },
  });
  if (!unlimitedPlan) {
    console.log('! Не нашёл UNLIMITED-план, пропускаю покупку');
  } else {
    const existingPurchase = await p.purchase.findFirst({
      where: { userId: demoUser.id, courseId: course.id, status: 'ACTIVE' },
    });
    if (!existingPurchase) {
      await p.purchase.create({
        data: {
          userId: demoUser.id,
          courseId: course.id,
          planId: unlimitedPlan.id,
          status: 'ACTIVE',
          expiresAt: null,
          paymentAmount: unlimitedPlan.price,
          paymentCurrency: unlimitedPlan.currency,
          paymentStatus: 'COMPLETED',
          paymentMethod: 'admin_manual',
        },
      });
      console.log('✓ Выдана UNLIMITED-покупка студенту student@nailacademy.kz');
    } else {
      console.log('= У student@... уже есть активная покупка');
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  АДМИН Камила (хозяйка платформы):');
  console.log('    kamila@nailacademy.kz / Kamila2026!');
  console.log('');
  console.log('  АДМИН Демо Автор (владелец курса маникюра):');
  console.log('    demo-author@nailacademy.kz / DemoAuthor2026!');
  console.log('');
  console.log('  СТУДЕНТ с купленным курсом:');
  console.log('    student@nailacademy.kz / Student2026!');
  console.log('');
  console.log('  СТУДЕНТ без покупки:');
  console.log('    test@nailacademy.kz / TestStudent1!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await p.$disconnect();
})().catch((e) => { console.error('ERROR:', e); process.exit(1); });
