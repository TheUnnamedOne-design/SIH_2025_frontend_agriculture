import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useLanguage } from '@/hooks/useLanguage';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How to prevent common crop diseases?',
    answer: 'To prevent crop diseases: 1) Use disease-resistant varieties when available, 2) Practice crop rotation to break disease cycles, 3) Ensure proper spacing for air circulation, 4) Remove infected plant debris, 5) Apply preventive fungicides if necessary, 6) Monitor crops regularly for early detection.',
    category: 'Disease Management'
  },
  {
    id: '2',
    question: 'What fertilizer is best for rice?',
    answer: 'For rice cultivation: Use NPK fertilizer with ratio 4:2:1 (Nitrogen:Phosphorus:Potassium). Apply nitrogen in split doses - 50% at planting, 25% at tillering, and 25% at panicle initiation. Phosphorus should be applied at planting time. Potassium can be split between planting and flowering stages.',
    category: 'Fertilization'
  },
  {
    id: '3',
    question: 'How to deal with pests naturally?',
    answer: 'Natural pest control methods: 1) Encourage beneficial insects with companion planting, 2) Use neem oil as organic pesticide, 3) Practice intercropping to confuse pests, 4) Set up pheromone traps, 5) Apply diatomaceous earth for crawling insects, 6) Use soap spray for soft-bodied insects.',
    category: 'Pest Control'
  },
  {
    id: '4',
    question: 'When is the best time to plant wheat?',
    answer: 'Wheat planting timing varies by region: In temperate climates, plant winter wheat in fall (September-November) and spring wheat in early spring (March-May). Soil temperature should be 50-60°F (10-15°C). Plant when soil moisture is adequate but not waterlogged.',
    category: 'Crop Planning'
  },
  {
    id: '5',
    question: 'How much water do crops need?',
    answer: 'Water requirements vary by crop: Rice needs 1,200-2,500mm, wheat needs 450-650mm, corn needs 500-800mm per growing season. Monitor soil moisture at root zone depth. Water deeply but less frequently to encourage deep root growth. Consider drip irrigation for water efficiency.',
    category: 'Irrigation'
  },
  {
    id: '6',
    question: 'What causes yellowing of leaves?',
    answer: 'Leaf yellowing can indicate: 1) Nitrogen deficiency (starts with older leaves), 2) Overwatering or poor drainage, 3) Pest or disease issues, 4) Natural aging process, 5) pH imbalance affecting nutrient uptake, 6) Iron deficiency in alkaline soils. Proper diagnosis is key to treatment.',
    category: 'Plant Health'
  }
];

export default function FAQScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
  
  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      padding: 40,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 5,
    },
    categoriesContainer: {
      backgroundColor: colors.surface,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoriesScroll: {
      paddingHorizontal: 15,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeCategoryButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    activeCategoryButtonText: {
      color: '#FFFFFF',
    },
    faqContainer: {
      flex: 1,
      padding: 15,
    },
    faqItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
    },
    faqQuestion: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 10,
    },
    faqAnswer: {
      padding: 15,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    faqAnswerText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    categoryTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '500',
    },
  });

  const toggleExpansion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('faq.title') || 'Frequently Asked Questions'}</Text>
          <Text style={styles.subtitle}>{t('faq.subtitle') || 'Common farming questions and answers'}</Text>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.activeCategoryButton,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.activeCategoryButtonText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.faqContainer}>
          {filteredFAQs.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleExpansion(item.id)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedId === item.id ? (
                  <ChevronUp size={20} color={colors.text} />
                ) : (
                  <ChevronDown size={20} color={colors.text} />
                )}
              </TouchableOpacity>
              
              {expandedId === item.id && (
                <View style={styles.faqAnswer}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}