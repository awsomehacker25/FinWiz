import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

const LESSONS = [
  {
    id: '1',
    title: 'How to Save for a Visa',
    description: 'Learn about visa fees, required savings, and smart strategies for visa applications.',
    duration: '15 min',
    points: 100,
    completed: false,
    content: {
      sections: [
        {
          title: 'Understanding Visa Costs',
          text: 'Different visa types have different fees. H1-B visas cost around $460, while student visas cost $160.',
          quiz: {
            question: 'How much does an H1-B visa application cost?',
            options: ['$160', '$460', '$560', '$260'],
            correct: 1
          }
        },
        {
          title: 'Required Documentation',
          text: 'You need bank statements showing sufficient funds. The required amount varies by visa type.',
          quiz: {
            question: 'What financial document is most important for visa applications?',
            options: ['Credit card statement', 'Bank statement', 'Pay stub', 'Tax return'],
            correct: 1
          }
        },
        {
          title: 'Savings Timeline',
          text: 'Start saving at least 6-12 months before your planned visa application date.',
          quiz: {
            question: 'How early should you start saving for your visa?',
            options: ['1-2 months', '3-4 months', '6-12 months', '2+ years'],
            correct: 2
          }
        }
      ]
    }
  },
  {
    id: '2',
    title: 'Understanding US Taxes',
    description: 'Master the basics of US tax system, deductions, and filing requirements.',
    duration: '20 min',
    points: 150,
    completed: false,
    content: {
      sections: [
        {
          title: 'Tax Forms Overview',
          text: 'Common tax forms include W-2 for employees, 1099 for contractors, and 1040 for filing.',
          quiz: {
            question: 'Which form do employees typically receive from their employer?',
            options: ['1099', 'W-2', '1040', 'W-4'],
            correct: 1
          }
        },
        {
          title: 'Understanding Deductions',
          text: 'Deductions reduce your taxable income. Common ones include student loan interest and work expenses.',
          quiz: {
            question: 'What is the purpose of tax deductions?',
            options: [
              'Increase tax liability',
              'Reduce taxable income',
              'Increase credit score',
              'None of the above'
            ],
            correct: 1
          }
        }
      ]
    }
  },
  {
    id: '3',
    title: 'Building Credit',
    description: 'Learn how to establish and improve your credit score in the US.',
    duration: '25 min',
    points: 200,
    completed: false,
    content: {
      sections: [
        {
          title: 'Credit Score Basics',
          text: 'Credit scores range from 300-850. Payment history and credit utilization are key factors.',
          quiz: {
            question: 'What is the highest possible credit score?',
            options: ['700', '800', '850', '900'],
            correct: 2
          }
        },
        {
          title: 'Building Credit',
          text: 'Start with a secured credit card or become an authorized user on someone else\'s card.',
          quiz: {
            question: 'What is a good first step to build credit?',
            options: [
              'Take out a large loan',
              'Get a secured credit card',
              'Ignore credit completely',
              'Max out credit cards'
            ],
            correct: 1
          }
        }
      ]
    }
  }
];

export default function LiteracyHubScreen() {
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState(LESSONS);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);

  const calculateProgress = () => {
    const completed = lessons.filter(l => l.completed).length;
    return (completed / lessons.length) * 100;
  };

  const calculateTotalPoints = () => {
    return lessons
      .filter(l => l.completed)
      .reduce((sum, lesson) => sum + lesson.points, 0);
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const checkQuizAnswers = () => {
    const currentLesson = lessons.find(l => l.id === selected);
    const section = currentLesson.content.sections[currentSection];
    
    if (quizAnswers[currentSection] === section.quiz.correct) {
      Alert.alert('Correct!', 'Great job! Moving to next section...');
      if (currentSection < currentLesson.content.sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        // Lesson completed
        setLessons(prev =>
          prev.map(l =>
            l.id === selected ? { ...l, completed: true } : l
          )
        );
        Alert.alert('Congratulations!', `You've completed the lesson and earned ${currentLesson.points} points!`);
        setSelected(null);
      }
      setShowQuiz(false);
      setQuizAnswers({});
    } else {
      Alert.alert('Incorrect', 'Try again!');
    }
  };

  const LessonCard = ({ lesson }) => (
    <TouchableOpacity
      style={[styles.lessonCard, lesson.completed && styles.lessonCardCompleted]}
      onPress={() => {
        setSelected(lesson.id);
        setCurrentSection(0);
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
            setCurrentSection(0);
          }}
        >
          <Text style={styles.startButtonText}>
            {lesson.completed ? 'Review' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (selected) {
    const currentLesson = lessons.find(l => l.id === selected);
    const section = currentLesson.content.sections[currentSection];

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setSelected(null);
            setCurrentSection(0);
            setQuizAnswers({});
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
                onPress={() => setShowQuiz(true)}
              >
                <Text style={styles.quizButtonText}>Take Quiz</Text>
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
                    quizAnswers[currentSection] === index && styles.quizOptionSelected
                  ]}
                  onPress={() => handleAnswer(currentSection, index)}
                >
                  <Text
                    style={[
                      styles.quizOptionText,
                      quizAnswers[currentSection] === index && styles.quizOptionTextSelected
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !quizAnswers[currentSection] && styles.submitButtonDisabled
                ]}
                onPress={checkQuizAnswers}
                disabled={!quizAnswers[currentSection]}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
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
          <Text style={styles.statValue}>{Math.round(calculateProgress())}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{calculateTotalPoints()}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    flex: 1,
    padding: 20,
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  lessonCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    color: '#2c3e50',
  },
  lessonDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startButtonCompleted: {
    backgroundColor: '#81C784',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
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
    padding: 20,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
  lessonContainer: {
    padding: 20,
  },
  lessonPageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
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
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#81C784',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    marginBottom: 24,
  },
  quizButton: {
    backgroundColor: '#2196F3',
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
    color: '#2c3e50',
    marginBottom: 16,
  },
  quizOption: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quizOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  quizOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});