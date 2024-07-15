import { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, Linking, TouchableOpacity, Alert } from "react-native"
import { Link2, Plus, UserCog, Tag, CircleDashed, CircleCheck, User, Mail } from "lucide-react-native";

import { colors } from "@/styles/colors";
import { linksServer, Link } from "@/server/link-server";
import { participantsServer, Participant } from "@/server/participants-server";
import { validateInput } from "@/utils/validateInput";

import { Button, Input, Modal } from "@/components";

enum MODAL {
    NONE = 0,
    LINK = 1,
    PARTICIPANT = 2
}

export function Details({ tripId }: { tripId: string }) {
    const [refreshing, setRefreshing] = useState(false);

    const [isCreatingLinks, setIsCreatingLinks] = useState(false);
    const [isConfirmParticipant, setIsConfirmParticipant] = useState(false);
    const [showModal, setShowModal] = useState(MODAL.NONE);
    
    //link data
    const [links, setLinks] = useState([] as Link[]);
    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    //participant data
    const [participants, setParticipants] = useState([] as Participant[]);
    const [participantName, setParticipantName] = useState("");
    const [participantEmail, setParticipantEmail] = useState("");

    const getData = async () => {
        try {
            setRefreshing(true);
            const links = await linksServer.getLinksByTripId(tripId);
            setLinks(links);
            const participants = await participantsServer.getByTripId(tripId);
            setParticipants(participants);
        } catch (error) {
            console.log(error);
        } finally {
            setRefreshing(false);
        }
    }

    const handleCreateLink = async () => {
        try {     
            if (!linkTitle || !linkUrl) {
                return Alert.alert("Cadastrar Link", "digite todos os campos.");
            }

            let url = linkUrl;
            if (!url.includes('http://') || !url.includes('https://')) {
                url = `https://${ url }`;
                if (!validateInput.url(url)) {
                    return Alert.alert("Cadastrar Link", "digite uma url válida.");
                }
                setLinkUrl(url);
            }
            
            setIsCreatingLinks(true);
            await linksServer.create({
                title: linkTitle,
                url: url,
                tripId: tripId
            });
            Alert.alert("Cadastrar Link", "Link cadastrado com sucesso.", [
                {
                    text: "Ok",
                    onPress: () => {
                        setLinks([
                            ...links,
                            {
                                title: linkTitle,
                                url: url,
                                id: tripId
                            }
                        ])
                        setLinkTitle("");
                        setLinkUrl("");
                        setShowModal(MODAL.NONE);
                    }
                }
            ]);
        } catch (error) {
            console.log(error);
        } finally {
            setIsCreatingLinks(false)
        }
    }

    const handleLinking = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Não conseguiu abrir o link: ${url}`);
        }
    }

    const handleConfirmParticipant = async () => {
        try {
            if (!participantName || !participantEmail){
                return Alert.alert("Confirmar presença", "preencha todos os campos");
            }
            setIsConfirmParticipant(true);
            const newArr = participants.filter(item => item.email === participantEmail);
            if (newArr.length === 0) {
                return Alert.alert("Confirmar presença", "participante nào encontrado");
            }

            await participantsServer.confirmTripByParticipantId({
                name: participantName,
                email: participantEmail,
                participantId: newArr[0].id
            })

            Alert.alert("Confirmar presença", "presença confirmada com sucesso",[
                {
                    text: "Ok",
                    onPress: () => {                        
                        const newParticipantArray = participants.map(item => {
                            if (item.email === participantEmail) {
                                return {
                                    ...item,
                                    is_confirmed: true
                                }
                            }
                            return item
                        })                        
                        setParticipantName("");
                        setParticipantEmail("");
                        setParticipants(newParticipantArray);
                        setShowModal(MODAL.NONE);
                    }
                }
            ])
           
        } catch (error) {
            console.log(error);
        } finally {
            setIsConfirmParticipant(false);
        }
    }

    useEffect(() => {
        getData();
    },[]);

    return (
        <>
        <ScrollView 
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={getData}
                    className="py-4"
                />
            }
            className="flex-1 px-5 py-5"
        >

            <View className="border-b border-zinc-800 pb-6 mb-6">
                <Text className="text-zinc-50 text-2xl font-semibold pb-6">Links importantes</Text>
                <View className="gap-5">
                    { links.length === 0 ? 
                        <Text className="text-zinc-500 text-sm">Nenhuma link cadastrado.</Text>
                        : 
                        links.map((link, idx) => (
                            <View key={idx} className="flex-row items-center">
                                <View className="flex-1">
                                    <Text className="text-zinc-50 text-xl font-semibold pb-2">{ link.title }</Text>
                                    <TouchableOpacity onPress={() => handleLinking(link.url)}>
                                        <Text ellipsizeMode="tail" className="text-zinc-400 text-sm font-normal">{ link.url }</Text>
                                    </TouchableOpacity>
                                </View>
                                <Link2 color={ colors.zinc[400] } size={20} />
                            </View>
                        ))
                    }                    
                </View>
                <View className="pt-5">
                    <Button variant="secondary" onPress={() => setShowModal(MODAL.LINK)}>
                        <Plus color={colors.zinc[200]} size={20} />
                        <Button.Title>Cadastrar novo link</Button.Title>
                    </Button>
                </View>
            </View>

            <View>
                <Text className="text-zinc-100 text-xl font-semibold pb-6">Convidados</Text>
                <View className="gap-5">                    
                { participants.length === 0 ? 
                    <Text className="text-zinc-500 text-sm">Nenhuma participante cadastrado.</Text>
                    : 
                    participants.map(participant => (
                        <View key={participant.id} className="flex-row items-center">
                            <View className="flex-1">
                                <Text className="text-zinc-50 text-xl font-semibold pb-2">{ participant.name || "Participante" }</Text>                                
                                <Text className="text-zinc-400 text-sm font-normal">{ participant.email }</Text>                                
                            </View>
                            { participant.is_confirmed ? <CircleCheck color={ colors.lime[300] } size={20} /> : <CircleDashed color={ colors.zinc[400] } size={20} /> }                            
                        </View>
                    ))
                }
                </View>
                <View className="pt-5">
                    <Button variant="secondary" onPress={() => setShowModal(MODAL.PARTICIPANT)}>
                        <UserCog color={colors.zinc[200]} size={20} />
                        <Button.Title>Gerenciar convidados</Button.Title>
                    </Button>
                </View>
            </View>

        </ScrollView>

        <Modal
            title="Cadastrar link"
            subtitle="Todos convidados podem visualizar os links importantes."
            visible={showModal === MODAL.LINK}
            onClose={() => setShowModal(MODAL.NONE)}
        >
            <View className="gap-2 my-4">

                <Input variant="secondary">
                    <Tag color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        onChangeText={setLinkTitle}
                        value={linkTitle}
                        placeholder="Título do link"
                    />
                </Input>

                <Input variant="secondary">
                    <Link2 color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        onChangeText={setLinkUrl}
                        value={linkUrl}
                        autoCapitalize="none"
                        placeholder="URL"
                    />
                </Input>

                <View className="pt-2">
                    <Button isLoading={ isCreatingLinks } onPress={handleCreateLink}>
                        <Button.Title>Salvar link</Button.Title>
                    </Button>
                </View>

            </View>
        </Modal>

        <Modal
            title="Confirmar presença"
            subtitle="Você foi convidado(a) para participar de uma viagem para Florianópolis, Brasil nas datas de 16 a 27 de Agosto de 2024. Para confirmar sua presença na viagem, preencha os dados abaixo:"
            visible={showModal === MODAL.PARTICIPANT}
            onClose={() => setShowModal(MODAL.NONE)}
        >
            <View className="gap-2 my-4">

                <Input variant="secondary">
                    <User color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        onChangeText={setParticipantName}
                        value={participantName}
                        placeholder="Seu nome completo"
                    />
                </Input>

                <Input variant="secondary">
                    <Mail color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        onChangeText={setParticipantEmail}
                        value={participantEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Seu e-mail"
                    />
                </Input>

                <View className="pt-2">
                    <Button isLoading={ isConfirmParticipant } onPress={handleConfirmParticipant}>
                        <Button.Title>Confirmar presença</Button.Title>
                    </Button>
                </View>

            </View>
        </Modal>

        </>
    )
}