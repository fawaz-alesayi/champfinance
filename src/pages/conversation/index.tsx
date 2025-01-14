/* eslint-disable @typescript-eslint/no-misused-promises */
import { GetServerSideProps, InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import ChatInput from "~/components/ChatInput";
import Combox from "~/components/ComboBox";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import Lottie from "lottie-react";
import spinner from "~/components/spinner.json"
import { type z } from "zod";
import { type messageSchema } from "~/server/api/routers/chatRouter";
import { Card, Spinner } from "flowbite-react";


const Chat: NextPage = () => {
    const [message, setMessage] = useState<string>("");
    const [messagesArray, setMessagesArray] = useState<z.infer<typeof messageSchema>[]>([]);
    const { query } = useRouter();
    const nextMessage = api.chat.nextMessage.useMutation();
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messagesArray])

    const scrollToBottom = () => {
        if (endRef && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const nonSystemMessages = messagesArray.filter((message) => message.role !== "system");


    const messagesComponent = (
        nonSystemMessages.map((message, index) => {
            const isLastMessage = index === nonSystemMessages.length - 1;
            return (
                <div key={index} ref={isLastMessage ? endRef : undefined}>
                    <Card className="p-4 leading-7 shadow-xl max-w-[90%] mx-auto rounded-xl mb-2 text-justify" ref={isLastMessage ? endRef : undefined}>
                        <span className="font-black text-lg">{message.role === "user" ? "You" : "Champ"} </span>
                        {message.content}
                    </Card>
                </div>
            )
        })
    )

    const chatQuery = api.chat.initialChatMessage.useQuery({
        type: 'text',
        company: query.company as string ?? 'aramco',
    }, {
        enabled: true,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        onSuccess(data) {
            setMessagesArray(data?.messages)
        },
    })


    return (
        <>
            <Head>
                <title>ChampFinance {query.companyName} Report</title>
                <meta name="description" content="Gain inights to financial data using ChatGPT" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <header className="text-5xl text-center my-8 font-black">
                ChampFinance
            </header>
            <div className="overflow-y-auto mb-32">
                {chatQuery.isLoading ? <div>
                    <Lottie style={{height:200}}  animationData={spinner} className="m-5" />
                </div> : messagesComponent}
                {nextMessage.isLoading ? <div className="mx-auto text-center">
                    <Spinner size={'xl'} color={'purple'}
                        aria-label="Loading Question" className="text-indigo-300 text-center mt-2" />
                </div> : <></>}
            </div>
            <ChatInput value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={async (e) => {
                if (e.key === "Enter") {
                    const messagesWithNewOne = [...messagesArray, { role: "user", content: message } as const];
                    setMessagesArray(messagesWithNewOne);
                    setMessage("");
                    const result = await nextMessage.mutateAsync(messagesWithNewOne);
                    setMessagesArray([...messagesWithNewOne, result.message]);
                }
            }} onIconClick={async function () {
                const messagesWithNewOne = [...messagesArray, { role: "user", content: message } as const];
                setMessagesArray(messagesWithNewOne);
                setMessage("");
                const result = await nextMessage.mutateAsync(messagesWithNewOne);
                setMessagesArray([...messagesWithNewOne, result.message]);
            }} />
        </>
    );
};

export default Chat;
