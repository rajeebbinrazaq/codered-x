import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { getPlaylistData } from '../utils/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadChannels();
        }, [])
    );

    const loadChannels = async () => {
        setLoading(true);
        const data = await getPlaylistData();
        setChannels(data);
        setLoading(false);
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerRight: () => (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: spacing.m }}>
                        <Ionicons name="settings-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);


    const renderChannelItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Channel', { initialChannel: item, allChannels: channels })}
        >
            <View style={styles.iconContainer}>
                {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" />
                ) : (
                    <Ionicons name="tv-outline" size={32} color={colors.textSecondary} />
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.group}</Text>
            </View>
            <Ionicons name="play-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={styles.listContainer}>
                    <FlatList
                        data={channels}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderChannelItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="tv-outline" size={64} color={colors.border} />
                                <Text style={styles.emptyText}>No channels found.</Text>
                                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Profile')}>
                                    <Text style={styles.emptyBtnText}>Manage Playlists</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContainer: {
        flex: 1,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: spacing.s,
        padding: spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 8,
        marginRight: spacing.m,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
    },
    title: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: spacing.xl,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: spacing.m,
        marginBottom: spacing.l,
        textAlign: 'center',
    },
    emptyBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderRadius: 8,
    },
    emptyBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default HomeScreen;
