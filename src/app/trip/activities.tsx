import { useState, useEffect } from "react";
import { View, Text, ScrollView, FlatList, Keyboard, Alert } from "react-native"
import { TripData } from "./[id]";
import { PlusIcon, Tag, Calendar as IconCalendar, Clock, CircleCheck } from "lucide-react-native";
import dayjs from "dayjs";

import { colors } from "@/styles/colors";
import { activitiesServer, Activities as ActivitiesProps } from "@/server/activities-server";

import { Button, Modal, Input, Calendar } from "@/components";

type Props = {
    tripDatails: TripData
}

enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    NEW_ACTIVITY = 2
}

type ActivityProps = {
    title: string,
    date: string,
    hour: string
}

export function Activities({ tripDatails }: Props) {
    const [showModal, setShowModal] = useState(MODAL.NONE);
    const [isGetingActivities, setIsGetingActivities] = useState(false);
    const [isCreatingActivity, setIsCreatingActivity] = useState(false);
    //data
    const [activities, setActivities] = useState([] as ActivitiesProps[])
    const [activityTitle, setactivityTitle] = useState("");
    const [activityDate, setactivityDate] = useState("");
    const [activityHour, setactivityHour] = useState("");

    const getActivities = async () => {
        try {
            setIsGetingActivities(true);
            const activities = await activitiesServer.getActivitiesByTripId(tripDatails.id);
            setActivities(activities);
        } catch (error) {
            console.log(error);
        } finally {
            setIsGetingActivities(false);
        }
    }

    const handleCreateActivity = async () => {
        try {
            if (!activityTitle || !activityDate || !activityHour) {
                return Alert.alert("Criar atividade", "por favor, preencha todos os campos");
            }

            if (Number(activityHour) < 0 || Number(activityHour) > 23) {
                return Alert.alert("Criar atividade", "insira um horário válido");
            }

            setIsCreatingActivity(true);
            const activityId = await activitiesServer.create({
                tripId: tripDatails.id,
                occurs_at: dayjs(activityDate).add(Number(activityHour), "h").toString(),
                title: activityTitle
            })
            Alert.alert("Criar atividade", "Atividade criada com sucesso", [
                {
                    text: "Ok",
                    onPress: () => {
                        handleNewActivity({
                            title: activityTitle,
                            date: activityDate,
                            hour: activityHour
                        })
                        setactivityTitle("");
                        setactivityDate("");
                        setactivityHour("");
                        setShowModal(MODAL.NONE);
                    }
                }
            ])
        } catch (error) {
            console.log(error);
        } finally {
            setIsCreatingActivity(false);
        }
    }

    const handleNewActivity = (activity: ActivityProps) => {
        const newActivities = activities.map(item => {            
            if (dayjs(item.date).isSame(activity.date, 'day')) {
                const newActivitiesitem = [
                    ...item.activities,
                    {
                        id: tripDatails.id,
                        title: activity.title,
                        occurs_at: `${ dayjs(activity.date).format('YYYY-MM-DD') } ${activity.hour}:00:00`,
                    }
                ]
                //@ts-ignore
                newActivitiesitem.sort((a, b) => { return new Date(a.occurs_at) - new Date(b.occurs_at); });
                return {
                    date: item.date,
                    activities: newActivitiesitem
                } 
            }
            return item;
        });
        setActivities(newActivities);
    }

    useEffect(() => {
        getActivities();
    },[]);

    return (
        <>
        <View className="w-full flex-row mt-5 mb-6 items-center px-5">
            <Text className="text-zinc-50 text-2xl font-semibold flex-1">Atividades</Text>                
            <View className="w-52">
                <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
                    <PlusIcon color={colors.lime[950]} size={20} />
                    <Button.Title>Nova atividade</Button.Title>
                </Button>
            </View>
        </View>

        <FlatList 
            className="flex-1 px-5"
            contentContainerClassName="gap-3"
            data={activities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
                <View className="pb-3">
                    <View className="flex-row items-baseline ">
                        <Text className="text-zinc-300 text-xl">Dia { dayjs(item.date).format('DD') }</Text>
                        <Text className="text-zinc-500 text-sm ml-2">{ dayjs(item.date).format('dddd').replace("-feira","") }</Text>
                    </View>
                    <View className="gap-2.5 pt-2.5">
                    { item.activities.length === 0 ? (
                        <Text className="text-zinc-500 text-sm">Nenhuma atividade cadastrada nessa data.</Text>
                    ) : item.activities.map(item => (
                        <View key={item.id} className="w-full flex-row bg-zinc-900 rounded-xl p-4 items-center border border-zinc-800">
                            <CircleCheck color={colors.lime[300]} size={20} />
                            <Text className="flex-1 text-zinc-100 text-base pl-3">{ item.title }</Text>
                            <Text className="text-zinc-400 text-sm">{ dayjs(item.occurs_at).format('HH[:]mm[h]') }</Text>
                        </View>
                    )) }
                    </View>
                </View>
            )}
            ListFooterComponent={<View className="h-32"></View>}
            onRefresh={getActivities}
            refreshing={isGetingActivities}
            showsVerticalScrollIndicator={false}
        />

        <Modal
            title="Cadastrar atividades"
            subtitle="Todos os convidados irão visualizar"
            visible={ showModal === MODAL.NEW_ACTIVITY }
            onClose={() =>  setShowModal(MODAL.NONE)}
        >

            <View className="gap-2 my-4">
                <Input variant="secondary">
                    <Tag color={ colors.zinc[400] } size={20} />
                    <Input.Field 
                        placeholder="Qual a atividade?" 
                        onChangeText={setactivityTitle}
                        value={activityTitle}
                    />
                </Input>

                <View className="w-full flex-row gap-2">
                    <View className="flex-1">
                        <Input variant="secondary">
                            <IconCalendar color={ colors.zinc[400] } size={20} />
                            <Input.Field 
                                placeholder="Data" 
                                value={ activityDate ? dayjs(activityDate).format("DD [de] MMMM") : "" }
                                onFocus={() => Keyboard.dismiss()}
                                showSoftInputOnFocus={false}
                                onPressIn={() => setShowModal(MODAL.CALENDAR)}
                            />
                        </Input>
                    </View>
                    <View className="flex-1">
                        <Input variant="secondary">
                            <Clock color={ colors.zinc[400] } size={20} />
                            <Input.Field 
                                keyboardType="numeric"
                                maxLength={2}
                                placeholder="Horário?" 
                                onChangeText={(text) => setactivityHour(text.replace(".",""))}
                                value={activityHour}
                            />
                        </Input>
                    </View>
                </View>

                <View className="pt-2">
                    <Button isLoading={ isCreatingActivity } onPress={handleCreateActivity}>
                        <Button.Title>Salvar atividade</Button.Title>
                    </Button>
                </View>
            </View>

        </Modal>

        <Modal
            title="Selecionar a data"
            subtitle="Selecione a data da atividade"
            visible={ showModal === MODAL.CALENDAR }
            onClose={() =>  setShowModal(MODAL.NEW_ACTIVITY)}
        >
            <View className="gap-4 mt-4">
                <Calendar 
                    initialDate={ tripDatails.starts_at }
                    minDate={ tripDatails.starts_at }
                    maxDate={ tripDatails.ends_at }
                    onDayPress={(day) => setactivityDate(day.dateString)}
                    markedDates={{ [activityDate]: { selected: true } }}
                />

                <View className="pt-2">
                    <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
                        <Button.Title>Selecionar data</Button.Title>
                    </Button>
                </View>
            </View>
        </Modal>
        </>
    )
}