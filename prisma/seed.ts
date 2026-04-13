import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (careful in production!)
  await prisma.skill.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  // Seed skills
  const skills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'Product Strategy',
        description: 'Learn product strategy frameworks and decision-making',
        category: 'product-management',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Prompt Engineering',
        description: 'Master prompt design for better AI outputs',
        category: 'ai-engineering',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'User Research',
        description: 'Conduct effective user research and leverage insights',
        category: 'product-management',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'AI Fundamentals',
        description: 'Understand AI models, LLMs, and how they work',
        category: 'ai-engineering',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Product Metrics',
        description: 'Define and track metrics that matter',
        category: 'product-management',
      },
    }),
    prisma.skill.create({
      data: {
        name: 'Retrieval Augmented Generation',
        description: 'Build RAG systems for smarter AI apps',
        category: 'ai-engineering',
      },
    }),
  ]);

  console.log(`✅ Created ${skills.length} skills`);

  // Seed subscription plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'free',
        priceUsd: 0,
        billingCycle: 'monthly',
        lessonsPerDay: 1,
        maxSkillPaths: 1,
        aiCoachingIncluded: false,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'starter',
        priceUsd: 1999, // $19.99
        billingCycle: 'monthly',
        lessonsPerDay: 3,
        maxSkillPaths: 3,
        aiCoachingIncluded: false,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'pro',
        priceUsd: 4999, // $49.99
        billingCycle: 'monthly',
        lessonsPerDay: 10,
        maxSkillPaths: 10,
        aiCoachingIncluded: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'premium',
        priceUsd: 9999, // $99.99
        billingCycle: 'monthly',
        lessonsPerDay: 999, // unlimited
        maxSkillPaths: 999, // unlimited
        aiCoachingIncluded: true,
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} subscription plans`);

  // Create skill paths for first skill (beginners only for MVP)
  const skillPath = await prisma.skillPath.create({
    data: {
      skillId: skills[0].id, // Product Strategy
      level: 'beginner',
      durationHours: 10,
    },
  });

  console.log(`✅ Created skill path: ${skillPath.id}`);

  // Create sample lessons for the skill path
  const lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        skillPathId: skillPath.id,
        day: 1,
        title: 'What is Product Strategy?',
        content: 'Product strategy is the high-level vision and plan for how a product will achieve its goals. It defines what problems we are solving, who we are solving them for, and how we will measure success. A great product strategy aligns the team, guides decision-making, and helps prioritize resources.',
        durationMinutes: 5,
        difficulty: 'beginner',
        quizzes: {
          create: [
            {
              type: 'multiple-choice',
              question: 'What is the primary goal of product strategy?',
              options: ['Make the product prettier', 'Define vision and align the team', 'Reduce costs at all costs', 'Add more features'],
              correctAnswer: 'Define vision and align the team',
              explanation: 'Product strategy helps define the vision and aligns teams around shared goals.',
            },
          ],
        },
      },
    }),
    prisma.lesson.create({
      data: {
        skillPathId: skillPath.id,
        day: 2,
        title: 'Understanding Your Users',
        content: 'Before building strategy, you must understand your users deeply. This includes their pain points, motivations, behaviors, and needs. User research methods include interviews, surveys, analytics, and user testing. The best strategies are built on real user understanding.',
        durationMinutes: 5,
        difficulty: 'beginner',
        quizzes: {
          create: [
            {
              type: 'multiple-choice',
              question: 'Which is NOT a valid user research method?',
              options: ['User interviews', 'Surveys', 'Fortune telling', 'Analytics review'],
              correctAnswer: 'Fortune telling',
              explanation: 'While interviews, surveys, and analytics are valid research methods, fortune telling is not a legitimate user research technique.',
            },
          ],
        },
      },
    }),
    prisma.lesson.create({
      data: {
        skillPathId: skillPath.id,
        day: 3,
        title: 'Setting Strategic Goals',
        content: 'Goals provide direction and help measure progress. Good goals are SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. Product goals should align with business objectives and user needs. Examples include increasing engagement, improving retention, or expanding to new markets.',
        durationMinutes: 5,
        difficulty: 'beginner',
        quizzes: {
          create: [
            {
              type: 'multiple-choice',
              question: 'What does SMART stand for in goal-setting?',
              options: ['Simple, Measurable, Achievable, Relevant, Time-bound', 'Specific, Measurable, Achievable, Relevant, Time-bound', 'Strategic, Measurable, Achievable, Relevant, Time-based', 'Specific, Meaningful, Achievable, Relevant, Time-bound'],
              correctAnswer: 'Specific, Measurable, Achievable, Relevant, Time-bound',
              explanation: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. This framework ensures goals are clear and attainable.',
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${lessons.length} lessons`);
  console.log('🎉 Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
