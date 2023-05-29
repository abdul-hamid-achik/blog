"use client";

// @ts-ignore
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function Page() {
    useEffect(()=>{
        (async function () {
            const cal = await getCalApi();
            cal("ui", {"styles":{"branding":{"brandColor":"#000000"}},"hideEventTypeDetails":false});
        })();
    }, [])

    return <div className="py-6 prose dark:prose-invert">
        <h2 className="mb-2 text-md">Schedule a meeting</h2>
        <p>
            I&apos;m available for a 30 minute meeting to discuss your project. Please select a time that works for you.
        </p>
        <Cal calLink="abdulachik/30min" className="py-6 mx-auto w-fit h-fit overflow-y-scroll"/>
    </div>
}
