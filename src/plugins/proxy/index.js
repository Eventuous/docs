module.exports = async function proxy(context, options) {
    const isProd = process.env.NODE_ENV === 'production';

    return {
        name: 'proxy',
        injectHtmlTags() {
            if (!isProd) {
                return {};
            }
            return {
                headTags: [
                    {
                        tagName: 'script',
                        attributes: {
                            async: false,
                            src: '/js/proxy.js',
                        },
                    },
                ],
            };
        },
    };
};