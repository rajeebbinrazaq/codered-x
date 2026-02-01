import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, FlatList, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { parseM3U } from '../utils/m3uParser';
import { getPlaylists, addPlaylist, deletePlaylist, renamePlaylist, selectPlaylist, getActivePlaylistId, fetchAndSyncCloudPlaylists } from '../utils/mockData';

const ProfileScreen = () => {
    const [playlists, setPlaylists] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // ... (rest of states)

    // ... (rest of functions)

    const handleCloudSync = async () => {
        setSyncing(true);
        const result = await fetchAndSyncCloudPlaylists();
        setSyncing(false);

        if (result.success) {
            if (result.count > 0) {
                Alert.alert('Success', `Successfully synced ${result.count} cloud playlist(s).`);
                loadData();
            } else {
                Alert.alert('Info', 'No valid playlists found or all failed to download.');
            }
        } else {
            Alert.alert('Error', 'Failed to fetch cloud playlists.');
        }
    };


    // Naming Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [pendingChannels, setPendingChannels] = useState(null);

    // Rename Modal State
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renameName, setRenameName] = useState('');
    const [renameId, setRenameId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const p = await getPlaylists();
        const a = await getActivePlaylistId();
        setPlaylists(p);
        setActiveId(a);
        setLoading(false);
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'] });
            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const response = await fetch(fileUri);
            const content = await response.text();
            const channels = parseM3U(content);

            if (channels.length > 0) {
                setPendingChannels(channels);
                setNewPlaylistName(result.assets[0].name.replace('.m3u', '').replace('.m3u8', ''));
                setModalVisible(true);
            } else {
                Alert.alert('Error', 'No channels found in the playlist.');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to read the playlist file.');
        }
    };

    const saveNewPlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        const success = await addPlaylist(newPlaylistName, pendingChannels);
        if (success) {
            setModalVisible(false);
            setPendingChannels(null);
            setNewPlaylistName('');
            loadData();
        }
    };

    const handleSelect = async (id) => {
        const success = await selectPlaylist(id);
        if (success) setActiveId(id);
    };

    const handleDelete = async (id, name) => {
        console.log(`[ProfileScreen] Direct Delete Request for ID: ${id}`);
        // Temporarily bypassing Alert to debug
        const success = await deletePlaylist(id);
        if (success) {
            loadData();
        } else {
            Alert.alert('Error', 'Failed to delete playlist.');
        }
    };

    const openRename = (id, currentName) => {
        setRenameId(id);
        setRenameName(currentName);
        setRenameModalVisible(true);
    };

    const handleRename = async () => {
        if (!renameName.trim()) return;
        const success = await renamePlaylist(renameId, renameName);
        if (success) {
            setRenameModalVisible(false);
            loadData();
        }
    };

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const renderPlaylistItem = ({ item }) => {
        const isActive = item.id === activeId;
        return (
            <View key={item.id} style={[styles.playlistCard, isActive && styles.activeCard]}>
                <TouchableOpacity style={styles.playlistInfo} onPress={() => handleSelect(item.id)}>
                    <Ionicons name={isActive ? "checkbox" : "square-outline"} size={22} color={isActive ? colors.primary : colors.textSecondary} />
                    <View style={{ marginLeft: spacing.m }}>
                        <Text style={[styles.playlistName, isActive && styles.activeText]}>{item.name}</Text>
                        <Text style={styles.playlistCount}>{item.channels.length} Channels</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.playlistActions}>
                    <TouchableOpacity onPress={() => openRename(item.id, item.name)} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {/* Developer Header Profile */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={48} color={colors.primary} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name}>codeRed X Developer</Text>
                    <Text style={styles.role}>rajeeb binrazaq</Text>
                    <Text style={styles.roleSub}>Lead Software Engineer</Text>
                </View>
            </View>

            {/* Playlist Management Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Playlists</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleCloudSync} disabled={syncing}>
                            {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />}
                            <Text style={styles.uploadBtnText}>{syncing ? 'Fetching...' : 'Fetch Cloud'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
                            <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                            <Text style={styles.uploadBtnText}>Upload M3U</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ margin: spacing.l }} />
                ) : (
                    <View>
                        {playlists.length > 0 ? (
                            playlists.map(item => renderPlaylistItem({ item }))
                        ) : (
                            <Text style={styles.emptyText}>No playlists uploaded yet.</Text>
                        )}
                    </View>
                )}
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Developer</Text>
                <View style={styles.bioCard}>
                    <Text style={styles.bioText}>
                        Myself rajeeb binrazaq, passionate software developer specializing in web and mobile applications. <Text style={styles.boldText}>codeRed X</Text> is built with a focus on delivering a premium,
                        minimalist IPTV experience.
                    </Text>
                </View>
            </View>

            {/* Connect Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connect</Text>
                <View style={styles.linksContainer}>
                    <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://github.com/rajeebbinrazaq')}>
                        <Ionicons name="logo-github" size={20} color={colors.text} />
                        <Text style={styles.linkItemText}>GitHub</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://linkedin.com')}>
                        <Ionicons name="logo-linkedin" size={20} color={colors.text} />
                        <Text style={styles.linkItemText}>LinkedIn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem} onPress={() => openLink('mailto:rajeebrasak@gmail.com')}>
                        <Ionicons name="mail-outline" size={20} color={colors.text} />
                        <Text style={styles.linkItemText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.versionText}>Built with ❤️ by RBR • Version 1.0.0</Text>
            </View>

            {/* Naming Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Name Playlist</Text>
                        <TextInput
                            style={styles.input}
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            placeholder="Enter playlist name..."
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveNewPlaylist}>
                                <Text style={styles.saveText}>Add Playlist</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Rename Modal */}
            <Modal visible={renameModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename Playlist</Text>
                        <TextInput
                            style={styles.input}
                            value={renameName}
                            onChangeText={setRenameName}
                            placeholder="Update playlist name..."
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => setRenameModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleRename}>
                                <Text style={styles.saveText}>Update Name</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.l,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: spacing.l,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    headerInfo: {
        marginLeft: spacing.l,
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    role: {
        fontSize: 14,
        color: colors.primary,
        marginTop: 2,
        fontWeight: '600',
    },
    roleSub: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: spacing.l,
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(230, 31, 23, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    uploadBtnText: {
        marginLeft: 6,
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    playlistCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.m,
        marginBottom: spacing.s,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeCard: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(230, 31, 23, 0.05)',
    },
    playlistInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playlistName: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
    activeText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    playlistCount: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    playlistActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        marginLeft: spacing.m,
        padding: 5,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: spacing.m,
        fontStyle: 'italic',
        backgroundColor: colors.card,
        padding: spacing.l,
        borderRadius: 12,
    },
    bioCard: {
        backgroundColor: colors.card,
        padding: spacing.l,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bioText: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: 'bold',
        color: colors.text,
    },
    linksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.s,
    },
    linkItem: {
        flex: 1,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    linkItemText: {
        marginLeft: 8,
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
    versionText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: spacing.xl,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    input: {
        height: 55,
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: spacing.l,
        color: colors.text,
        fontSize: 16,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    modalBtn: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    saveBtn: {
        backgroundColor: colors.primary,
    },
    cancelText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
