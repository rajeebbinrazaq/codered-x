import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="code-slash" size={60} color={colors.primary} />
                </View>
                <Text style={styles.name}>codeRed X Developer</Text>
                <Text style={styles.role}>Mobile Application Engineer</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>
                    Passionate about building minimal and modern Android applications.
                    codeRed X is designed for simplicity and performance.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connect</Text>

                <TouchableOpacity style={styles.linkRow} onPress={() => openLink('https://github.com')}>
                    <Ionicons name="logo-github" size={24} color={colors.text} />
                    <Text style={styles.linkText}>GitHub Profile</Text>
                    <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} onPress={() => openLink('https://twitter.com')}>
                    <Ionicons name="logo-twitter" size={24} color={colors.text} />
                    <Text style={styles.linkText}>Twitter / X</Text>
                    <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.version}>Version 1.0.0</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.l,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.s,
    },
    role: {
        fontSize: 16,
        color: colors.primary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.s,
    },
    bio: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: spacing.m,
        borderRadius: 8,
        marginBottom: spacing.s,
    },
    linkText: {
        flex: 1,
        marginLeft: spacing.m,
        color: colors.text,
        fontSize: 16,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
    },
    version: {
        color: colors.textSecondary,
        fontSize: 12,
    },
});

export default ProfileScreen;
