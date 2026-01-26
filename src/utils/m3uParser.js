export const parseM3U = (content) => {
    const lines = content.split('\n');
    const playlist = [];
    let currentItem = {};

    lines.forEach((line) => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            // Example: #EXTINF:-1 tvg-logo="url" group-title="Group",Channel Name
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');

            let title = '';
            let metadataString = '';

            if (commaIndex !== -1) {
                title = info.substring(commaIndex + 1).trim();
                metadataString = info.substring(0, commaIndex);
            } else {
                metadataString = info;
            }

            // fast regex for logo
            const logoMatch = metadataString.match(/tvg-logo="([^"]*)"/);
            const logo = logoMatch ? logoMatch[1] : null;

            // fast regex for group
            const groupMatch = metadataString.match(/group-title="([^"]*)"/);
            const group = groupMatch ? groupMatch[1] : 'Uncategorized';

            currentItem = { title, logo, group };
        } else if (!line.startsWith('#')) {
            // It's a URL
            if (currentItem.title) {
                currentItem.url = line;
                playlist.push(currentItem);
                currentItem = {};
            }
        }
    });

    return playlist;
};
