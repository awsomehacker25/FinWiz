import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getLiteracyProgress, upsertLiteracyProgress } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

const LESSONS = [
  {
    id: '1',
    title: 'How to Save for a Visa',
    description: 'Learn about visa fees, required savings, and smart strategies for visa applications. This lesson covers everything you need to know to prepare financially for your visa journey, including documentation, timelines, and budgeting tips.',
    duration: '25 min',
    points: 150,
    completed: false,
    content: {
      sections: [
        {
          title: 'Understanding Visa Costs',
          text: 'Different visa types have different fees. H1-B visas cost around $460, while student visas cost $160. It is important to check the latest fees on the official government website, as they can change. In addition to the application fee, you may also need to pay for services like SEVIS, biometrics, and premium processing. Always budget extra for unexpected costs.',
          quiz: {
            question: 'How much does an H1-B visa application cost?',
            options: ['$160', '$460', '$560', '$260'],
            correct: 1,
            explanations: [
              'This is the cost for a student visa, not H1-B.',
              'Correct! The H1-B application fee is $460 as per the latest guidelines.',
              'This is not a standard fee for H1-B or student visas.',
              'This is not a standard fee for H1-B or student visas.'
            ]
          }
        },
        {
          title: 'Required Documentation',
          text: 'You need bank statements showing sufficient funds. The required amount varies by visa type. Other documents include your passport, I-20 or DS-2019 for students, job offer letter for work visas, and proof of ties to your home country. Organize your documents in advance and keep both digital and physical copies.',
          quiz: {
            question: 'What financial document is most important for visa applications?',
            options: ['Credit card statement', 'Bank statement', 'Pay stub', 'Tax return'],
            correct: 1,
            explanations: [
              'Credit card statements do not show your available funds.',
              'Correct! Bank statements prove you have enough funds for your stay.',
              'Pay stubs show income but not total available funds.',
              'Tax returns are useful but not the primary proof of funds.'
            ]
          }
        },
        {
          title: 'Savings Timeline',
          text: 'Start saving at least 6-12 months before your planned visa application date. This gives you time to build up the required funds, handle unexpected expenses, and demonstrate financial stability. Consider setting up automatic transfers to a dedicated savings account.',
          quiz: {
            question: 'How early should you start saving for your visa?',
            options: ['1-2 months', '3-4 months', '6-12 months', '2+ years'],
            correct: 2,
            explanations: [
              'This is usually not enough time to save the required amount.',
              'This may be too short for most visa types.',
              'Correct! 6-12 months is a safe and recommended timeline.',
              '2+ years is more than necessary for most visa types.'
            ]
          }
        },
        {
          title: 'Budgeting for Visa Fees',
          text: 'Create a detailed budget that includes all possible visa-related expenses: application fees, travel, accommodation, and emergency funds. Use budgeting apps or spreadsheets to track your progress.',
          quiz: {
            question: 'Which of the following should NOT be included in your visa budget?',
            options: ['Application fees', 'Travel costs', 'Entertainment expenses', 'Emergency funds'],
            correct: 2,
            explanations: [
              'Application fees are a core part of your budget.',
              'Travel costs are essential to include.',
              'Correct! Entertainment is not a visa-related expense.',
              'Emergency funds are important for unexpected situations.'
            ]
          }
        },
        {
          title: 'Tracking Your Progress',
          text: 'Regularly review your savings and adjust your plan as needed. Set milestones and celebrate small wins to stay motivated. If you fall behind, look for ways to cut expenses or increase your income.',
          quiz: {
            question: 'What is a good way to stay motivated while saving for your visa?',
            options: ['Ignore your progress', 'Set milestones and celebrate small wins', 'Wait until the last minute', 'Spend more on entertainment'],
            correct: 1,
            explanations: [
              'Ignoring progress can lead to missed goals.',
              'Correct! Milestones and small celebrations keep you motivated.',
              'Waiting until the last minute is risky.',
              'Spending more on entertainment can derail your savings.'
            ]
          }
        }
      ]
    }
  },
  {
    id: '2',
    title: 'Understanding US Taxes',
    description: 'Master the basics of the US tax system, deductions, filing requirements, and how to optimize your tax situation as an immigrant or newcomer. This lesson covers forms, deadlines, credits, and common mistakes to avoid.',
    duration: '30 min',
    points: 180,
    completed: false,
    content: {
      sections: [
        {
          title: 'Tax Forms Overview',
          text: 'In the US, there are several important tax forms. Employees typically receive a W-2 from their employer, which reports annual wages and the amount of taxes withheld. Independent contractors receive a 1099 form. The 1040 is the main form used to file your individual federal income tax return. Understanding which forms you need is crucial for accurate filing.',
          quiz: {
            question: 'Which form do employees typically receive from their employer?',
            options: ['1099', 'W-2', '1040', 'W-4'],
            correct: 1,
            explanations: [
              '1099 is for independent contractors, not employees.',
              'Correct! W-2 is the standard form for employees.',
              '1040 is for individual tax returns, not employer forms.',
              'W-4 is for withholding tax, not employer forms.'
            ]
          }
        },
        {
          title: 'Filing Deadlines',
          text: 'The deadline to file your federal tax return is usually April 15th each year. If you need more time, you can file for an extension, but you must still pay any taxes owed by the original deadline to avoid penalties and interest. Missing the deadline can result in fines and additional charges.',
          quiz: {
            question: 'When is the typical deadline to file your federal tax return?',
            options: ['January 1', 'April 15', 'June 30', 'December 31'],
            correct: 1,
            explanations: [
              'January 1 is the start of the tax year, not the deadline.',
              'Correct! April 15 is the usual deadline.',
              'June 30 is not a standard tax deadline.',
              'December 31 is the end of the tax year, not the filing deadline.'
            ]
          }
        },
        {
          title: 'Tax Deductions',
          text: 'Deductions reduce your taxable income. Common deductions include student loan interest, mortgage interest, and work-related expenses. You can choose the standard deduction or itemize your deductions, whichever is more beneficial. Always keep receipts and documentation for any deductions you claim.',
          quiz: {
            question: 'What is the purpose of tax deductions?',
            options: [
              'Increase tax liability',
              'Reduce taxable income',
              'Increase credit score',
              'None of the above'
            ],
            correct: 1,
            explanations: [
              'Deductions are subtracted from your gross income to determine your taxable income.',
              'Correct! This is the primary purpose of tax deductions.',
              'Credit scores are not directly affected by tax deductions.',
              'Tax deductions are not a way to increase your credit score.'
            ]
          }
        },
        {
          title: 'Tax Credits',
          text: 'Tax credits directly reduce the amount of tax you owe, dollar for dollar. Examples include the Earned Income Tax Credit (EITC), Child Tax Credit, and education credits. Credits are generally more valuable than deductions because they reduce your tax bill directly.',
          quiz: {
            question: 'How do tax credits differ from deductions?',
            options: [
              'Credits reduce your tax bill directly; deductions reduce taxable income',
              'Credits increase your refund; deductions increase your tax',
              'Credits are only for businesses',
              'There is no difference'
            ],
            correct: 0,
            explanations: [
              'Correct! Credits reduce your tax bill directly, while deductions reduce your taxable income.',
              'This is not accurate; both can increase your refund, but in different ways.',
              'Credits are available to individuals and businesses.',
              'There is a significant difference between credits and deductions.'
            ]
          }
        },
        {
          title: 'Common Tax Mistakes',
          text: 'Common mistakes include missing the filing deadline, not reporting all income, and failing to sign your return. Double-check your forms and use tax software or a professional if you are unsure. Mistakes can lead to audits, penalties, or delayed refunds.',
          quiz: {
            question: 'Which of the following is a common tax mistake?',
            options: [
              'Filing on time',
              'Reporting all income',
              'Not signing your return',
              'Keeping good records'
            ],
            correct: 2,
            explanations: [
              'Filing on time is the correct action, not a mistake.',
              'Reporting all income is required by law.',
              'Correct! Forgetting to sign your return is a common error.',
              'Keeping good records is best practice.'
            ]
          }
        }
      ]
    }
  },
  {
    id: '3',
    title: 'Building Credit',
    description: 'Learn how to establish and improve your credit score in the US. This lesson covers credit basics, how to start building credit, common pitfalls, and tips for maintaining a healthy score.',
    duration: '30 min',
    points: 200,
    completed: false,
    content: {
      sections: [
        {
          title: 'Credit Score Basics',
          text: 'Credit scores range from 300-850. Payment history and credit utilization are key factors. A higher score indicates better creditworthiness. Lenders use your score to decide whether to approve loans and what interest rate to offer.',
          quiz: {
            question: 'What is the highest possible credit score?',
            options: ['700', '800', '850', '900'],
            correct: 2,
            explanations: [
              '700 is a good score, but 850 is the maximum.',
              '800 is a strong score, but not the highest.',
              'Correct! 850 is the highest possible credit score.',
              '900 is not a standard credit score.'
            ]
          }
        },
        {
          title: 'Establishing Credit',
          text: 'If you are new to the US, you may not have a credit history. You can start building credit by applying for a secured credit card, becoming an authorized user on someone else’s card, or taking out a small credit-builder loan. Always make payments on time.',
          quiz: {
            question: 'What is a good first step to build credit?',
            options: [
              'Take out a large loan',
              'Get a secured credit card',
              'Ignore credit completely',
              'Max out credit cards'
            ],
            correct: 1,
            explanations: [
              'Taking out a large loan can negatively impact your credit score.',
              'Correct! A secured credit card is a safe way to build credit.',
              'Ignoring credit completely will prevent you from establishing a history.',
              'Maxing out credit cards can indicate financial instability.'
            ]
          }
        },
        {
          title: 'Payment History',
          text: 'Your payment history is the most important factor in your credit score. Always pay your bills on time, including credit cards, loans, and utilities. Late payments can stay on your credit report for up to seven years.',
          quiz: {
            question: 'What is the most important factor in your credit score?',
            options: ['Credit utilization', 'Payment history', 'Length of credit history', 'Types of credit'],
            correct: 1,
            explanations: [
              'Credit utilization is important, but not the most important.',
              'Correct! Payment history has the biggest impact.',
              'Length of credit history matters, but less than payment history.',
              'Types of credit are a smaller factor.'
            ]
          }
        },
        {
          title: 'Credit Utilization',
          text: 'Credit utilization is the ratio of your credit card balances to your credit limits. Keeping your utilization below 30% is recommended. High utilization can lower your score, even if you pay on time.',
          quiz: {
            question: 'What is a recommended maximum credit utilization ratio?',
            options: ['10%', '30%', '50%', '100%'],
            correct: 1,
            explanations: [
              '10% is excellent, but 30% is the standard recommendation.',
              'Correct! Try to keep utilization below 30%.',
              '50% is too high and can hurt your score.',
              '100% utilization is very risky.'
            ]
          }
        },
        {
          title: 'Checking Your Credit Report',
          text: 'You are entitled to a free credit report from each of the three major bureaus (Equifax, Experian, TransUnion) once per year. Review your report for errors and dispute any inaccuracies.',
          quiz: {
            question: 'How often can you get a free credit report from each bureau?',
            options: ['Once a month', 'Once a year', 'Every five years', 'Never'],
            correct: 1,
            explanations: [
              'Monthly free reports are not standard.',
              'Correct! You get one free report per year from each bureau.',
              'Five years is too infrequent.',
              'You are entitled to a free report annually.'
            ]
          }
        }
      ]
    }
  },
  {
    id: '4',
    title: 'Budgeting Basics',
    description: 'Learn how to create and stick to a budget, track your expenses, and set realistic financial goals. This lesson covers budgeting methods, tools, and tips for building healthy financial habits.',
    duration: '25 min',
    points: 160,
    completed: false,
    content: {
      sections: [
        {
          title: 'Why Budgeting Matters',
          text: 'Budgeting helps you control your money, avoid overspending, and reach your financial goals. It gives you a clear picture of your income and expenses, so you can make informed decisions.',
          quiz: {
            question: 'What is the main benefit of budgeting?',
            options: ['It helps you spend more', 'It helps you control your money', 'It increases your income', 'It eliminates all expenses'],
            correct: 1,
            explanations: [
              'Budgeting is about control, not spending more.',
              'Correct! Budgeting helps you control your money.',
              'Budgeting does not directly increase income.',
              'You will always have some expenses.'
            ]
          }
        },
        {
          title: 'Types of Budgets',
          text: 'There are several budgeting methods, such as the 50/30/20 rule, zero-based budgeting, and envelope system. Choose the one that fits your lifestyle and goals.',
          quiz: {
            question: 'Which budgeting method allocates 50% to needs, 30% to wants, and 20% to savings?',
            options: ['Envelope system', 'Zero-based budgeting', '50/30/20 rule', 'Pay-yourself-first'],
            correct: 2,
            explanations: [
              'Envelope system uses cash for categories.',
              'Zero-based budgeting assigns every dollar a job.',
              'Correct! The 50/30/20 rule is a popular method.',
              'Pay-yourself-first prioritizes savings, but not with these percentages.'
            ]
          }
        },
        {
          title: 'Tracking Expenses',
          text: 'Tracking your expenses helps you see where your money goes. Use apps, spreadsheets, or a notebook to record every purchase. Review your spending regularly to spot patterns and areas to cut back.',
          quiz: {
            question: 'Why is it important to track your expenses?',
            options: ['To increase spending', 'To see where your money goes', 'To avoid saving', 'To pay more taxes'],
            correct: 1,
            explanations: [
              'Tracking is for awareness, not spending more.',
              'Correct! It helps you understand your spending habits.',
              'Tracking helps you save, not avoid it.',
              'Tracking does not affect your taxes directly.'
            ]
          }
        },
        {
          title: 'Setting Financial Goals',
          text: 'Set specific, measurable, achievable, relevant, and time-bound (SMART) goals. Examples include saving for an emergency fund, paying off debt, or buying a car.',
          quiz: {
            question: 'Which is an example of a SMART financial goal?',
            options: ['Save some money', 'Pay off $1,000 of debt in 6 months', 'Get rich quick', 'Spend more on entertainment'],
            correct: 1,
            explanations: [
              'This goal is too vague.',
              'Correct! It is specific and time-bound.',
              'Get rich quick is not realistic or specific.',
              'Spending more is not a financial goal.'
            ]
          }
        },
        {
          title: 'Sticking to Your Budget',
          text: 'Review your budget regularly and adjust as needed. Use reminders, automate savings, and reward yourself for meeting milestones to stay motivated.',
          quiz: {
            question: 'What can help you stick to your budget?',
            options: ['Ignore your budget', 'Automate savings and set reminders', 'Never review your spending', 'Spend impulsively'],
            correct: 1,
            explanations: [
              'Ignoring your budget leads to overspending.',
              'Correct! Automation and reminders help you stay on track.',
              'Regular reviews are important.',
              'Impulsive spending breaks your budget.'
            ]
          }
        }
      ]
    }
  },
  {
    id: '5',
    title: 'Saving and Investing',
    description: 'Discover the basics of saving and investing, including types of accounts, risk vs. reward, and how to start building wealth for the future.',
    duration: '30 min',
    points: 180,
    completed: false,
    content: {
      sections: [
        {
          title: 'Why Save and Invest?',
          text: 'Saving provides security for emergencies and future needs. Investing helps your money grow over time, outpacing inflation and building wealth.',
          quiz: {
            question: 'What is the main reason to invest your money?',
            options: ['To lose money', 'To grow wealth over time', 'To avoid taxes', 'To spend more'],
            correct: 1,
            explanations: [
              'Investing is for growth, not loss.',
              'Correct! Investing helps your money grow.',
              'Investing does not eliminate taxes.',
              'Spending more is not a reason to invest.'
            ]
          }
        },
        {
          title: 'Types of Savings Accounts',
          text: 'Common savings accounts include regular savings, high-yield savings, and certificates of deposit (CDs). Each has different interest rates and access rules.',
          quiz: {
            question: 'Which account typically offers the highest interest rate?',
            options: ['Checking account', 'High-yield savings', 'Regular savings', 'Cash under mattress'],
            correct: 1,
            explanations: [
              'Checking accounts usually have low or no interest.',
              'Correct! High-yield savings accounts offer better rates.',
              'Regular savings have lower rates than high-yield.',
              'Cash under the mattress earns no interest.'
            ]
          }
        },
        {
          title: 'Understanding Risk and Reward',
          text: 'Investments with higher potential returns usually come with higher risk. Diversifying your investments can help manage risk.',
          quiz: {
            question: 'What is the relationship between risk and reward in investing?',
            options: ['Higher risk, higher potential reward', 'Lower risk, higher reward', 'No risk, high reward', 'Risk and reward are unrelated'],
            correct: 0,
            explanations: [
              'Correct! Higher risk can mean higher reward.',
              'Lower risk usually means lower reward.',
              'No investment is high reward with no risk.',
              'Risk and reward are closely related.'
            ]
          }
        },
        {
          title: 'Starting to Invest',
          text: 'Start investing early, even with small amounts. Use retirement accounts like IRAs or employer-sponsored 401(k)s to benefit from tax advantages and compound growth.',
          quiz: {
            question: 'What is a good way to start investing for retirement?',
            options: ['Open an IRA or 401(k)', 'Keep cash only', 'Wait until you are older', 'Invest in one stock only'],
            correct: 0,
            explanations: [
              'Correct! IRAs and 401(k)s are great for retirement savings.',
              'Cash alone does not grow much over time.',
              'Starting early is better than waiting.',
              'Diversification is safer than investing in one stock.'
            ]
          }
        },
        {
          title: 'Avoiding Investment Scams',
          text: 'Be wary of investments that promise high returns with little or no risk. Research before investing and avoid offers that sound too good to be true.',
          quiz: {
            question: 'Which is a sign of a potential investment scam?',
            options: ['Guaranteed high returns', 'Registered with government agencies', 'Transparent fees', 'Long track record'],
            correct: 0,
            explanations: [
              'Correct! Guarantees of high returns are a red flag.',
              'Registration is a good sign, not a scam.',
              'Transparency is a positive sign.',
              'A long track record is a good sign.'
            ]
          }
        }
      ]
    }
  }
];

export default function LiteracyHubScreen() {
  const { user } = useContext(AuthContext);
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState(LESSONS);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState({}); // { correct?: boolean, show?: boolean }
  const [showExplanations, setShowExplanations] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Helper to build progress object for API
  const buildProgressObject = (lessonsArr) => {
    const progress = {};
    lessonsArr.forEach(lesson => {
      progress[lesson.id] = {
        completed: lesson.completed,
        questions: lesson.questions || {}
      };
    });
    return progress;
  };

  // Merge API progress into local lessons
  const mergeProgress = (apiProgress) => {
    let totalQuestionsAnswered = 0;
    const updatedLessons = LESSONS.map(lesson => {
      const progress = apiProgress[lesson.id] || {};
      const questions = progress.questions || {};
      // Count answered questions
      totalQuestionsAnswered += Object.values(questions).filter(Boolean).length;
      return {
        ...lesson,
        completed: !!progress.completed,
        questions: { ...questions },
      };
    });
    setLessons(updatedLessons);
    setQuestionsAnswered(totalQuestionsAnswered);
  };

  // Fetch progress on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getLiteracyProgress(user.email || user.id);
        mergeProgress(data.lessons || {});
      } catch (err) {
        // Optionally handle error
      } finally {
        setProgressLoaded(true);
      }
    })();
  }, [user]);

  // Save progress to API
  const saveProgress = async (updatedLessons) => {
    if (!user) return;
    const progress = buildProgressObject(updatedLessons);
    try {
      await upsertLiteracyProgress(user.email || user.id, progress);
    } catch (err) {
      // Optionally handle error
    }
  };

  const calculateProgress = () => {
    const completed = lessons.filter(l => l.completed).length;
    return (completed / lessons.length) * 100;
  };

  // Helper: get points per question for a lesson
  const getPointsPerQuestion = (lesson) => {
    const numQuestions = lesson.content.sections.length;
    return lesson.points / numQuestions;
  };

  // Calculate total points earned (per question)
  const calculateTotalPoints = () => {
    return lessons.reduce((sum, lesson) => {
      const perQ = getPointsPerQuestion(lesson);
      const numCorrect = Object.values(lesson.questions || {}).filter(Boolean).length;
      return sum + perQ * numCorrect;
    }, 0);
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
    setQuizFeedback({ show: false });
    setShowExplanations(false);
  };

  const checkQuizAnswers = () => {
    const currentLesson = lessons.find(l => l.id === selected);
    const section = currentLesson.content.sections[currentSection];
    const userAnswer = quizAnswers[currentSection];
    if (userAnswer === section.quiz.correct) {
      setQuizFeedback({ correct: true, show: true });
      setShowExplanations(true);
      // Update per-question progress and persist
      const updatedLessons = lessons.map(l => {
        if (l.id !== selected) return l;
        const questions = { ...(l.questions || {}) };
        questions[currentSection] = true;
        return { ...l, questions };
      });
      setLessons(updatedLessons);
      // Update questions answered stat
      const totalQuestions = updatedLessons.reduce((acc, l) => acc + Object.values(l.questions || {}).filter(Boolean).length, 0);
      setQuestionsAnswered(totalQuestions);
      saveProgress(updatedLessons);
    } else {
      setQuizFeedback({ correct: false, show: true, wrongExplanation: section.quiz.explanations[userAnswer] });
      setShowExplanations(false);
    }
  };

  const handleNextSection = () => {
    const currentLesson = lessons.find(l => l.id === selected);
    if (currentSection < currentLesson.content.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizFeedback({});
      setShowExplanations(false);
    } else {
      // Lesson completed
      const updatedLessons = lessons.map(l =>
        l.id === selected ? { ...l, completed: true } : l
      );
      setLessons(updatedLessons);
      saveProgress(updatedLessons);
      setSelected(null);
      setCurrentSection(0);
      setQuizAnswers({});
      setShowQuiz(false);
      setQuizFeedback({});
      setShowExplanations(false);
    }
  };

  // Helper: get first unanswered section index for a lesson
  const getFirstUnansweredSection = (lesson) => {
    const questions = lesson.questions || {};
    const sections = lesson.content.sections;
    for (let i = 0; i < sections.length; i++) {
      if (!questions[i]) return i;
    }
    return 0; // All answered, default to first
  };

  // Helper: get lesson progress state
  const getLessonProgressState = (lesson) => {
    const questions = lesson.questions || {};
    const total = lesson.content.sections.length;
    const answered = Object.values(questions).filter(Boolean).length;
    if (lesson.completed) return 'review';
    if (answered === 0) return 'start';
    if (answered < total) return 'continue';
    return 'review';
  };

  // Elegant Reset progress handler
  const handleResetProgress = async () => {
    if (!user) return;
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your literacy progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
            await upsertLiteracyProgress(user.email || user.id, {});
            setLessons(LESSONS.map(l => ({ ...l, completed: false, questions: {} })));
            setQuestionsAnswered(0);
          }
        }
      ]
    );
  };

  const LessonCard = ({ lesson }) => {
    const progressState = getLessonProgressState(lesson);
    let buttonText = 'Start';
    if (progressState === 'continue') buttonText = 'Continue';
    if (progressState === 'review') buttonText = 'Review';
    return (
      <TouchableOpacity
        style={[styles.lessonCard, lesson.completed && styles.lessonCardCompleted]}
        onPress={() => {
          setSelected(lesson.id);
          setCurrentSection(getFirstUnansweredSection(lesson));
          setQuizAnswers({});
          setShowQuiz(false);
        }}
      >
        <View style={styles.lessonHeader}>
          <View style={styles.lessonMeta}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
          </View>
          {lesson.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.lessonDescription}>{lesson.description}</Text>
        <View style={styles.lessonFooter}>
          <Text style={styles.pointsText}>{lesson.points} points</Text>
          <TouchableOpacity
            style={[
              styles.startButton,
              lesson.completed && styles.startButtonCompleted
            ]}
            onPress={() => {
              setSelected(lesson.id);
              setCurrentSection(getFirstUnansweredSection(lesson));
            }}
          >
            <Text style={styles.startButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (selected) {
    const currentLesson = lessons.find(l => l.id === selected);
    const section = currentLesson.content.sections[currentSection];
    const userAnswer = quizAnswers[currentSection];
    const correctIndex = section.quiz.correct;

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setSelected(null);
            setCurrentSection(0);
            setQuizAnswers({});
            setQuizFeedback({});
            setShowExplanations(false);
          }}
        >
          <Text style={styles.backButtonText}>← Back to Lessons</Text>
        </TouchableOpacity>

        <View style={styles.lessonContainer}>
          <Text style={styles.lessonPageTitle}>{currentLesson.title}</Text>
          <View style={styles.progressIndicator}>
            {currentLesson.content.sections.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentSection && styles.progressDotActive,
                  index < currentSection && styles.progressDotCompleted
                ]}
              />
            ))}
          </View>

          {!showQuiz ? (
            <>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.text}</Text>
              <TouchableOpacity
                style={styles.quizButton}
                onPress={() => {
                  setShowQuiz(true);
                  setQuizFeedback({});
                  setShowExplanations(false);
                }}
              >
                <Text style={styles.quizButtonText}>Answer Question</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.quizContainer}>
              <Text style={styles.quizQuestion}>{section.quiz.question}</Text>
              {section.quiz.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quizOption,
                    userAnswer === index && styles.quizOptionSelected,
                    quizFeedback.show && quizFeedback.correct && index === correctIndex && styles.quizOptionCorrect,
                    quizFeedback.show && !quizFeedback.correct && userAnswer === index && styles.quizOptionIncorrect
                  ]}
                  onPress={() => handleAnswer(currentSection, index)}
                  disabled={quizFeedback.show && quizFeedback.correct}
                >
                  <Text
                    style={[
                      styles.quizOptionText,
                      userAnswer === index && styles.quizOptionTextSelected
                    ]}
                  >
                    {option}
                  </Text>
                  {quizFeedback.show && quizFeedback.correct && showExplanations && (
                    <Text style={styles.explanationText}>{section.quiz.explanations[index]}</Text>
                  )}
                  {quizFeedback.show && !quizFeedback.correct && userAnswer === index && (
                    <Text style={styles.explanationText}>{quizFeedback.wrongExplanation}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {!quizFeedback.show && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    userAnswer === undefined && styles.submitButtonDisabled
                  ]}
                  onPress={checkQuizAnswers}
                  disabled={userAnswer === undefined}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                </TouchableOpacity>
              )}
              {quizFeedback.show && !quizFeedback.correct && (
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#E53935', fontWeight: 'bold', fontSize: 16 }}>Incorrect. Please try again.</Text>
                </View>
              )}
              {quizFeedback.show && quizFeedback.correct && (
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 16 }}>Correct! 🎉</Text>
                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 16 }]}
                    onPress={handleNextSection}
                  >
                    <Text style={styles.submitButtonText}>
                      {currentSection < currentLesson.content.sections.length - 1 ? 'Next Question' : 'Finish Lesson'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Literacy Hub</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>COMPLETED</Text>
          <Text style={styles.statValue}>{Math.round(calculateProgress())}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>POINTS</Text>
          <Text style={styles.statValue}>{calculateTotalPoints()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>QUESTIONS</Text>
          <Text style={styles.statValue}>{questionsAnswered}</Text>
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetProgress}
          accessibilityLabel="Reset Progress"
        >
          <MaterialIcons name="refresh" size={18} color="#FF6B6B" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.list}
        data={lessons}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LessonCard lesson={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#204d63',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#cfe0ee',
    marginBottom: 4,
    fontWeight: '700',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  lessonCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  lessonCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonMeta: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#cfe0ee',
    marginTop: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#dbe8f1',
    marginBottom: 16,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    color: '#7cc4ff',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  startButtonCompleted: {
    backgroundColor: '#647DEE',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: '#3B82F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  lessonContainer: {
    padding: 16,
  },
  lessonPageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#224459',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#647DEE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    color: '#dbe8f1',
    lineHeight: 24,
    marginBottom: 24,
  },
  quizButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quizButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizContainer: {
    gap: 16,
  },
  quizQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  quizOption: {
    backgroundColor: '#14384c',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#224459',
  },
  quizOptionSelected: {
    backgroundColor: '#243a73',
    borderColor: '#3B82F6',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#e9f2f9',
  },
  quizOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#3B82F6',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizOptionCorrect: {
    backgroundColor: '#1e7342',
    borderColor: '#1e7342',
  },
  quizOptionIncorrect: {
    backgroundColor: '#7a2b2b',
    borderColor: '#D32F2F',
  },
  explanationText: {
    fontSize: 13,
    color: '#cfe0ee',
    marginTop: 4,
    fontStyle: 'italic',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
});