import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { parseM3U } from '../utils/m3uParser';
import { MOCK_PLAYLIST } from '../utils/mockData';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const HomeScreen = ({ navigation }) => {
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        // Load mock data initially
        const parsed = parseM3U(MOCK_PLAYLIST);
        setChannels(parsed);
    }, []);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const response = await fetch(fileUri);
            const fileContent = await response.text();
            const parsed = parseM3U(fileContent);

            if (parsed.length > 0) {
                setChannels(parsed);
            } else {
                alert('No channels found in playlist');
            }
        } catch (err) {
            console.error('Error reading file:', err);
            alert('Failed to read playlist file');
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerRight: () => (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={pickDocument} style={{ marginRight: spacing.m }}>
                        <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: spacing.m }}>
                        <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
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
            <View style={styles.listContainer}>
                <FlatList
                    data={channels}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderChannelItem}
                    contentContainerStyle={styles.list}
                />
            </View>
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
});

export default HomeScreen;
