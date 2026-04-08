import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

import SKILLS_DATA from '../articles/skills.json';
import ATTRIBUTES_DATA from '../articles/attributes.json';
import PLAYING_STYLES_DATA from '../articles/playingStyles.json';
import INSTRUCTIONS_DATA from '../articles/instructions.json';

const SkillItem = ({ name, description }) => (
  <View style={styles.skillItem}>
    <Text style={styles.skillName}>{name}</Text>
    <Text style={styles.skillDesc}>{description}</Text>
  </View>
);

const CategoryHeader = ({ title }) => (
  <View style={styles.catHeader}>
    <View style={styles.catLine} />
    <Text style={styles.catTitle}>{title}</Text>
    <View style={styles.catLine} />
  </View>
);

const BrochureScreen = ({ onClose }) => {
  const [activeChapter, setActiveChapter] = useState(null);
  const [search, setSearch] = useState('');

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuIntro}>READ EFOOTBALL ARTICLES</Text>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => { setSearch(''); setActiveChapter('skills'); }}>
        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>🧠</Text></View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>All skills explained</Text>
          <Text style={styles.menuSubtitle}>Master player abilities & special traits</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => { setSearch(''); setActiveChapter('attributes'); }}>
        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>📊</Text></View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>All player attributes</Text>
          <Text style={styles.menuSubtitle}>Understand stats & performance metrics</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => { setSearch(''); setActiveChapter('styles'); }}>
        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>🎮</Text></View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>Playing styles</Text>
          <Text style={styles.menuSubtitle}>Master player movements & AI behavior</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => { setSearch(''); setActiveChapter('instructions'); }}>
        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>📋</Text></View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>Individual Instructions</Text>
          <Text style={styles.menuSubtitle}>A Case Study on Tactical Utility</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      <View style={[styles.menuItem, { opacity: 0.3 }]}>
        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>📈</Text></View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>Progression Guide</Text>
          <Text style={styles.menuSubtitle}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );

  const renderSkills = () => {
    const q = search.toLowerCase();
    const filteredContent = SKILLS_DATA.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => 
        (s.name || '').toLowerCase().includes(q) || 
        (s.desc || '').toLowerCase().includes(q)
      )
    })).filter(cat => cat.skills.length > 0);

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH SKILLS..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView style={styles.skillsScroll} showsVerticalScrollIndicator={false}>
          {filteredContent.map((cat) => (
            <React.Fragment key={cat.category}>
              <CategoryHeader title={cat.category} />
              {cat.skills.map(skill => (
                <SkillItem key={skill.name} name={skill.name} description={skill.desc} />
              ))}
            </React.Fragment>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  const renderAttributes = () => {
    const q = search.toLowerCase();
    const filteredContent = ATTRIBUTES_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(i => 
        (i.name || '').toLowerCase().includes(q) || 
        (i.desc || '').toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0);

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH ATTRIBUTES..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView style={styles.skillsScroll} showsVerticalScrollIndicator={false}>
          {filteredContent.map((cat) => (
            <React.Fragment key={cat.category}>
              <CategoryHeader title={cat.category} />
              {cat.intro && <Text style={styles.categoryIntro}>{cat.intro}</Text>}
              {cat.items.map(item => (
                <SkillItem key={item.name} name={item.name} description={item.desc} />
              ))}
            </React.Fragment>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  const renderPlayStyles = () => {
    const q = search.toLowerCase();
    const filteredContent = PLAYING_STYLES_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(i => 
        (i.name || '').toLowerCase().includes(q) || 
        (i.desc || '').toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0);

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH PLAYSTYLES..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView style={styles.skillsScroll} showsVerticalScrollIndicator={false}>
          {filteredContent.map((cat) => (
            <React.Fragment key={cat.category}>
              <CategoryHeader title={cat.category} />
              {cat.items.map(item => (
                <SkillItem key={item.name} name={item.name} description={item.desc} />
              ))}
              {cat.outro && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>💡 {cat.outro}</Text>
                </View>
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  const renderInstructions = () => {
    const q = search.toLowerCase();
    const isMatched = (text) => text.toLowerCase().includes(q);
    
    // Check if any content matches the search
    const hasMatch = search === '' || 
      isMatched(INSTRUCTIONS_DATA.title) || 
      INSTRUCTIONS_DATA.content.some(c => c.type === 'text' && isMatched(c.value));

    if (!hasMatch) {
      return (
        <View style={styles.loaderContainer}>
          <Text style={styles.loaderText}>No results found for "{search}"</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH CONTENT..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView style={styles.redditScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.redditTitle}>{INSTRUCTIONS_DATA.title}</Text>
          
          {INSTRUCTIONS_DATA.content.map((item, index) => {
            if (item.type === 'text') {
              // Basic header detection
              const isHeader = item.value.startsWith('###');
              const cleanText = item.value.replace('### ', '');
              
              return (
                <Text 
                  key={index} 
                  style={[
                    styles.redditText, 
                    isHeader && styles.redditHeader,
                    { marginBottom: 15 }
                  ]}
                >
                  {cleanText}
                </Text>
              );
            }
            if (item.type === 'image') {
              return (
                <View key={index} style={styles.articleImageContainer}>
                  <Image 
                    source={{ uri: item.url }} 
                    style={styles.articleImage} 
                    resizeMode="contain"
                  />
                  {item.caption && (
                    <Text style={styles.imageCaption}>💡 {item.caption.toUpperCase()}</Text>
                  )}
                </View>
              );
            }
            return null;
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  };

  const getSubTitle = () => {
    if (activeChapter === 'skills') return 'SKILLS ENCYCLOPEDIA';
    if (activeChapter === 'attributes') return 'STATISTICS GUIDE';
    if (activeChapter === 'styles') return 'PLAYSTYLE ANALYTICS';
    if (activeChapter === 'instructions') return 'CASE STUDY';
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={activeChapter ? () => setActiveChapter(null) : onClose} 
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>EFOOTBALL ARTICLES</Text>
          {activeChapter && <Text style={styles.headerSubtitle}>{getSubTitle()}</Text>}
        </View>
      </View>
      
      <View style={styles.content}>
        {activeChapter === 'skills' ? renderSkills() : 
         activeChapter === 'attributes' ? renderAttributes() : 
         activeChapter === 'styles' ? renderPlayStyles() :
         activeChapter === 'instructions' ? renderInstructions() :
         renderMenu()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  headerSubtitle: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  
  content: { flex: 1 },
  menuContainer: { padding: 20 },
  menuIntro: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12
  },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,255,136,0.1)', justifyContent: 'center', alignItems: 'center' },
  menuIcon: { fontSize: 20 },
  menuTextWrap: { flex: 1, marginLeft: 16 },
  menuTitle: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 2 },
  menuSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },
  arrowIcon: { color: COLORS.accent, fontSize: 18, fontWeight: 'bold' },

  searchBarWrapper: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchBarInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, height: 44 },
  searchIcon: { fontSize: 14, marginRight: 10, opacity: 0.3 },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700' },
  clearSearchIcon: { color: 'rgba(255,255,255,0.3)', fontSize: 14, paddingHorizontal: 4 },

  skillsScroll: { flex: 1, paddingHorizontal: 20 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  catLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  catTitle: { color: COLORS.accent, fontSize: 11, fontWeight: '900', marginHorizontal: 15, letterSpacing: 2 },
  categoryIntro: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic', marginBottom: 20, lineHeight: 18, textAlign: 'center' },
  
  skillItem: { marginBottom: 20 },
  skillName: { color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 4, textTransform: 'uppercase' },
  skillDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, fontWeight: '500' },

  noteBox: { 
    backgroundColor: 'rgba(0,255,136,0.03)', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(0,255,136,0.1)', 
    marginTop: -10, 
    marginBottom: 25 
  },
  noteText: { color: COLORS.accent, fontSize: 11, fontStyle: 'italic', lineHeight: 16, fontWeight: '500' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loaderText: { color: 'rgba(255,255,255,0.5)', marginTop: 15, fontSize: 12, fontWeight: '600' },
  retryBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
  
  redditScroll: { flex: 1, padding: 20 },
  redditTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 30, lineHeight: 32, textAlign: 'center' },
  redditHeader: { color: COLORS.accent, fontSize: 13, fontWeight: '900', marginTop: 35, marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' },
  redditText: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 22, fontWeight: '500' },
  articleImageContainer: { marginVertical: 25, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  articleImage: { width: '100%', height: 210, borderRadius: 12 },
  imageCaption: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 12, textAlign: 'center' },
  redditContentBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
});

export default BrochureScreen;
