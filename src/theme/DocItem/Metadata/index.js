import React from 'react';
import Metadata from '@theme-original/DocItem/Metadata';
import {useDoc} from "@docusaurus/theme-common/internal";
import {useSidebarBreadcrumbs} from "@docusaurus/theme-common/internal";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

let previous = null;

export default function MetadataWrapper(props) {
    if (ExecutionEnvironment.canUseDOM && window.analytics) {

        const x = useDoc();
        if (previous !== x) {
            previous = x;
            const sb = useSidebarBreadcrumbs();
            const category = sb[0].label;
            const page = sb[sb.length - 1].label;
            setTimeout(() => window.analytics.page(page, {category: category}), 0);
            // console.log('category', category);
            // console.log('page', page);
        }
    }
    return (
        <>
            <Metadata {...props} />
        </>
    );
}
