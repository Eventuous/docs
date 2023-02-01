import React, { useEffect } from 'react';
import Layout from '@theme/Layout';

const BoardToken = 'b6d8458c-13b9-3c13-fca1-6b13b9aae532';

const Feedback = () => {
    useEffect(() => {
        (function(w,d,i,s){function l(){if(!d.getElementById(i)){var f=d.getElementsByTagName(s)[0],e=d.createElement(s);e.type="text/javascript",e.async=!0,e.src="https://canny.io/sdk.js",f.parentNode.insertBefore(e,f)}}if("function"!=typeof w.Canny){var c=function(){c.q.push(arguments)};c.q=[],w.Canny=c,"complete"===d.readyState?l():w.attachEvent?w.attachEvent("onload",l):w.addEventListener("load",l,!1)}})(window,document,"canny-jssdk","script");

        Canny('render', {
            boardToken: BoardToken,
            basePath: "https://eventuous.dev/ideas",
            ssoToken: null,
        });
    }, []);

    return (
        <Layout title="Ideas" description="Submit an idea">
            <div
                style={{
                    height: '50vh',
                    fontSize: '20px',
                    backgroundColor: "white",
                    marginLeft: 20,
                    marginRight: 20,
                    minHeight: 600,
                }}>
            <div data-canny style={{marginRight: 10}}/>
            </div>
        </Layout>
    );
}

export default Feedback;