/**
 * @type {{ $schema: 'http://json.schemastore.org/chrome-manifest' }}
 **/
module.exports = {
    name: 'Maskbook',
    manifest_version: 2,
    web_accessible_resources: ['*.css', '*.js', '*.jpg', '*.png'],
    permissions: ['storage', 'downloads', 'webNavigation', 'activeTab'],
    optional_permissions: ['<all_urls>'],
    background: {
        page: 'background.html',
    },
    options_ui: {
        page: 'index.html',
        open_in_tab: true,
    },
    icons: {
        '16': '16x16.png',
        '48': '48x48.png',
        '128': '128x128.png',
        '256': '256x256.png',
    },
    browser_action: {
        default_popup: 'popup.html',
    },
    homepage_url: 'https://maskbook.com',
    description: 'Encrypt your posts & chats on You-Know-Where. Allow only your friends to decrypt.',
}
