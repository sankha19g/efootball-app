import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, POSITIONS, ALL_SKILLS } from '../constants';
import ProgressionIcon from './ProgressionIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SavedProgressionsModal = ({ visible, player, onClose, onUpdatePlayer, initialBuild }) => {
    const [progressions, setProgressions] = useState(player.progressions || []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingBuildId, setEditingBuildId] = useState(null);
    const [newBuild, setNewBuild] = useState({
        name: '',
        description: '',
        image: player.image,
        rating: player.rating,
        position: player.position,
        shooting: 0,
        passing: 0,
        dribbling: 0,
        dexterity: 0,
        lowerBody: 0,
        aerial: 0,
        defending: 0,
        gk1: 0,
        gk2: 0,
        gk3: 0,
        skill1: '',
        skill2: '',
        skill3: '',
        skill4: '',
        skill5: ''
    });

    React.useEffect(() => {
        if (initialBuild) {
            setNewBuild(initialBuild);
            setEditingBuildId(initialBuild.id);
            setIsAdding(true);
        } else {
            resetForm();
            setIsAdding(false);
            setEditingBuildId(null);
        }
    }, [initialBuild, visible]);

    const statFields = [
        { key: 'shooting', label: 'SHOOTING', icon: '🎯' },
        { key: 'passing', label: 'PASSING', icon: '👟' },
        { key: 'dribbling', label: 'DRIBBLING', icon: '⚽' },
        { key: 'dexterity', label: 'DEXTERITY', icon: '⚡' },
        { key: 'lowerBody', label: 'LOWER BODY', icon: '🦵' },
        { key: 'aerial', label: 'AERIAL', icon: '🦘' },
        { key: 'defending', label: 'DEFENDING', icon: '🛡️' },
        { key: 'gk1', label: 'GK 1', icon: '🧤' },
        { key: 'gk2', label: 'GK 2', icon: '🧤' },
        { key: 'gk3', label: 'GK 3', icon: '🧤' },
    ];

    const saveToBackend = (updatedProgressions) => {
        onUpdatePlayer(player._id, { ...player, progressions: updatedProgressions }, false);
        setProgressions(updatedProgressions);
    };

    const handleSaveBuild = () => {
        if (!newBuild.name) return;
        
        let updated;
        if (editingBuildId) {
            updated = progressions.map(p =>
                p.id === editingBuildId ? { ...p, ...newBuild } : p
            );
        } else {
            const build = {
                id: Date.now().toString(),
                ...newBuild
            };
            updated = [...progressions, build];
        }

        saveToBackend(updated);
        setIsAdding(false);
        setEditingBuildId(null);
        resetForm();
    };

    const resetForm = () => {
        setNewBuild({ 
            name: '', description: '', image: player.image, rating: player.rating, 
            position: player.position, shooting: 0, passing: 0, dribbling: 0, 
            dexterity: 0, lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, 
            gk3: 0, skill1: '', skill2: '', skill3: '', skill4: '', skill5: '' 
        });
    };

    const handleEdit = (build) => {
        setNewBuild(build);
        setEditingBuildId(build.id);
        setIsAdding(true);
    };

    const handleDelete = (id) => {
        const updated = progressions.filter(p => p.id !== id);
        saveToBackend(updated);
    };

    const StatIncremental = ({ stat }) => (
        <View style={styles.statRow}>
            <View style={styles.statInfo}>
                <ProgressionIcon statKey={stat.key} size={32} color={COLORS.accent} showBackground={true} />
                <Text style={[styles.statLabel, { marginLeft: 8 }]}>{stat.label}</Text>
                <Text style={styles.statVal}>{newBuild[stat.key] || 0}</Text>
            </View>
            <View style={styles.statControls}>
                <TouchableOpacity 
                    onPress={() => setNewBuild({...newBuild, [stat.key]: Math.max(0, (newBuild[stat.key]||0) - 1)})}
                    style={styles.controlBtn}
                >
                    <Text style={styles.controlText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setNewBuild({...newBuild, [stat.key]: Math.min(20, (newBuild[stat.key]||0) + 1)})}
                    style={styles.controlBtn}
                >
                    <Text style={styles.controlText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>SAVED PROGRESSIONS</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {isAdding ? (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>{editingBuildId ? 'EDIT BUILD' : 'CREATE NEW BUILD'}</Text>
                                
                                <View style={styles.formRow}>
                                    <View style={styles.imageBox}>
                                        {newBuild.image ? <Image source={{uri: newBuild.image}} style={styles.buildImg} /> : <Text style={styles.noImg}>📸</Text>}
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <TextInput 
                                            placeholder="Build Name (Target Man, etc.)"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            style={styles.input}
                                            value={newBuild.name}
                                            onChangeText={t => setNewBuild({...newBuild, name: t})}
                                        />
                                        <TextInput 
                                            placeholder="Rating"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            style={styles.inputRating}
                                            keyboardType="numeric"
                                            value={String(newBuild.rating)}
                                            onChangeText={t => setNewBuild({...newBuild, rating: Number(t)})}
                                        />
                                    </View>
                                </View>

                                <View style={styles.statsSection}>
                                    {statFields.map(s => <StatIncremental key={s.key} stat={s} />)}
                                </View>

                                <View style={styles.skillsSection}>
                                    <Text style={styles.skillsTitle}>✨ ADDITIONAL SKILLS</Text>
                                    <View style={styles.skillsGrid}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <TextInput 
                                                key={i}
                                                placeholder={`Added Skill ${i}`}
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                style={styles.skillInput}
                                                value={newBuild[`skill${i}`]}
                                                onChangeText={t => setNewBuild({...newBuild, [`skill${i}`]: t})}
                                            />
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.formActions}>
                                    <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelBtn}>
                                        <Text style={styles.btnText}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveBuild} style={styles.saveBtn}>
                                        <Text style={styles.btnTextPrimary}>SAVE BUILD</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                                    <Text style={styles.addBtnIcon}>+</Text>
                                    <Text style={styles.addBtnText}>CREATE NEW BUILD</Text>
                                </TouchableOpacity>

                                {progressions.map(build => (
                                    <View key={build.id} style={styles.buildCard}>
                                        <Image source={{uri: build.image}} style={styles.cardImg} />
                                        <View style={styles.cardInfo}>
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.cardName}>{build.name}</Text>
                                                <Text style={styles.cardRating}>{build.rating}</Text>
                                            </View>
                                            <View style={styles.statCloud}>
                                                {statFields.map(s => build[s.key] > 0 && (
                                                    <View key={s.key} style={styles.statPill}>
                                                        <ProgressionIcon statKey={s.key} size={16} color="rgba(255,255,255,0.8)" showBackground={true} />
                                                        <Text style={[styles.pillText, { marginLeft: 4 }]}>{build[s.key]}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity onPress={() => handleEdit(build)} style={styles.actionBtn}>
                                                <Text style={styles.actionIcon}>✎</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(build.id)} style={styles.actionBtn}>
                                                <Text style={styles.actionIcon}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    container: { height: SCREEN_HEIGHT * 0.85, backgroundColor: '#0a0a0c', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    title: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    closeText: { color: '#fff', fontSize: 14 },
    content: { flex: 1, padding: 15 },
    addBtn: { width: '100%', height: 60, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 20 },
    addBtnIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 24, fontWeight: '200' },
    addBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    
    buildCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardImg: { width: 45, height: 60, borderRadius: 8, backgroundColor: '#000' },
    cardInfo: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    cardName: { color: '#fff', fontSize: 13, fontWeight: '900' },
    cardRating: { color: COLORS.accent, fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 6, borderRadius: 4 },
    statCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    statPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
    pillText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800' },
    cardActions: { flexDirection: 'row', gap: 5 },
    actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    actionIcon: { color: 'rgba(255,255,255,0.2)', fontSize: 12 },

    formCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    formTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    formRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    imageBox: { width: 80, height: 110, borderRadius: 12, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    buildImg: { width: '100%', height: '100%', borderRadius: 12 },
    noImg: { fontSize: 24, opacity: 0.2 },
    inputGroup: { flex: 1, gap: 10 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 15, height: 45, color: '#fff', fontSize: 12, fontWeight: '700' },
    inputRating: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 15, height: 45, color: COLORS.accent, fontSize: 14, fontWeight: '900', width: 80 },
    
    statsSection: { gap: 8, marginBottom: 30 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
    statInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    statIcon: { fontSize: 14 },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    statVal: { color: '#fff', fontSize: 14, fontWeight: '900', marginLeft: 'auto', marginRight: 20, fontMono: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    statControls: { flexDirection: 'row', gap: 10 },
    controlBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    controlText: { color: '#fff', fontSize: 18, fontWeight: '300' },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    cancelBtn: { flex: 1, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    saveBtn: { flex: 2, height: 45, borderRadius: 15, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900' },
    btnTextPrimary: { color: '#000', fontSize: 10, fontWeight: '900' },

    skillsSection: { marginTop: 10, marginBottom: 25 },
    skillsTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
    skillsGrid: { gap: 8 },
    skillInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, paddingHorizontal: 15, height: 40, color: '#fff', fontSize: 11, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
});

export default SavedProgressionsModal;
