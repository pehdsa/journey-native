import { useState, useEffect } from "react";
import { View, SafeAreaView, TouchableOpacity, Keyboard, Alert } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { TripDetails, triServer } from "@/server/trip-server"; 
import { router } from "expo-router";
import { MapPin, Settings2, CalendarRange, Info, Calendar as IconCalendar } from "lucide-react-native";
import dayjs from "dayjs";
import { DateData } from "react-native-calendars"

import { DatesSelected, calendarUtils } from "@/utils/calendarUtils";
import { colors } from "@/styles/colors";

import { Loading, Input, Button, Modal, Calendar } from "@/components";
import { Activities } from "./activities";
import { Details } from "./details";

export type TripData = TripDetails & {
    when: string
}

enum MODAL {
    NONE = 0,
    UPDATE_TRIP = 1,
    CALENDAR = 2,
}

export default function Trip() {
    //Carregamento
    const [isLoadingTrip, setIsLoadingTrip] = useState(true);
    //Data
    const [tripDetails, setTripDetails] = useState({} as TripData)
    const [option, setOption] = useState<"activity" | "details">("activity")
    const [destination, setDestination] = useState("");
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
    const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)

    //Modal
    const [showModal, setShowModal] = useState(MODAL.NONE);

    const tripId = useLocalSearchParams<{ id: string }>().id;

    const getTripDetails = async () => {
        try {
            setIsLoadingTrip(true);
            if (!tripId) return router.back();
            const tripDetails = await triServer.getById(tripId);

            const maxLenghtDestination = 14;
            const destination = tripDetails.destination.length > maxLenghtDestination ? tripDetails.destination.slice(0, maxLenghtDestination) + "..." : tripDetails.destination;
            const start_at = dayjs(tripDetails.starts_at).format('DD');
            const end_at = dayjs(tripDetails.ends_at).format('DD');
            const month = dayjs(tripDetails.starts_at).format('MMM');

            setTripDetails({
                ...tripDetails,
                when: `${ destination } ${ start_at } até ${ end_at } de ${ month }.`
            });

            setDestination(tripDetails.destination);
            
        } catch (error) {
            throw error;
        } finally {
            setIsLoadingTrip(false);
        }
    }

    const handleSelectedDate = (selectedDay: DateData) => {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates);
    }

    const handleUpdateTrip = async () => {
        try {            
            if (!tripId) return;

            if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
                return Alert.alert("Atualizar viagem", "Insira todos os campos.")
            }
            setIsUpdatingTrip(true);

            await triServer.update({ 
                id: tripId,
                destination, 
                starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toString()
            })

            Alert.alert("Atualizar viagem", "Viagem atualizada com sucesso", [
                {
                    text: "Ok",
                    onPress: () => {
                        setShowModal(MODAL.NONE);
                        getTripDetails();
                    }
                }
            ])            

        } catch (error) {
            console.log(error)
        } finally {
            setIsUpdatingTrip(false);
        }
    }

    useEffect(() => {
        getTripDetails();
    },[]);

    if (isLoadingTrip) {
        return <Loading />
    }

    return (
        <SafeAreaView >            
            <View className="h-full px-5 pt-2 ">
                <Input variant="tertiary">
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field value={ tripDetails.when } readOnly />
                    <TouchableOpacity onPress={() => setShowModal(MODAL.UPDATE_TRIP)} activeOpacity={0.7}>
                        <View className="w-9 h-9 bg-zinc-800 items-center justify-center rounded">
                            <Settings2 color={colors.zinc[400]} size={20} />
                        </View>
                    </TouchableOpacity>
                </Input>

                { option === "activity" ? 
                    <Activities tripDatails={tripDetails} /> 
                    : 
                    <Details tripId={ tripDetails.id }  /> 
                }

                <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
                    <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border-zinc-800 gap-2">
                        
                        <View className="flex-1">
                            <Button variant={ option === 'activity' ? "primary" : "secondary" } onPress={() => setOption('activity')}>
                                <CalendarRange color={ option === "activity" ? colors.lime[950] : colors.zinc[200] } size={20} />
                                <Button.Title>Atividades</Button.Title>
                            </Button>
                        </View>

                        <View className="flex-1">
                            <Button  variant={ option === 'details' ? "primary" : "secondary" } onPress={() => setOption('details')}>
                                <Info color={ option === "details" ? colors.lime[950] : colors.zinc[200] } size={20} />
                                <Button.Title>Detalhes</Button.Title>
                            </Button>
                        </View>
                        
                    </View>
                </View>
            </View>

            <Modal 
                title="Atualizar viagem" 
                subtitle="Somente quem criou a viagem pode modifica-la"
                visible={showModal === MODAL.UPDATE_TRIP}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="gap-2 my-4">
                    
                    <Input variant="secondary">
                        <MapPin color={colors.zinc[400]} size={20} />
                        <Input.Field  
                            placeholder="Para onde?"
                            onChangeText={setDestination}
                            value={destination}
                        />                   
                    </Input>

                    <Input variant="secondary">
                        <IconCalendar color={colors.zinc[400]} size={20} />
                        <Input.Field  
                            placeholder="Quando?"
                            value={ selectedDates.formatDatesInText }
                            onPressIn={() => setShowModal(MODAL.CALENDAR)}
                            onFocus={() => Keyboard.dismiss()}
                        />                   
                    </Input>

                    <View className="mt-2">
                        <Button onPress={handleUpdateTrip} isLoading={ isUpdatingTrip }>
                            <Button.Title>Atualizar</Button.Title>
                        </Button>
                    </View>

                </View>
            </Modal>

            <Modal
                title="Selecionar datas"
                subtitle="Selecione a data de ida e volta da viagem"
                visible={ showModal === MODAL.CALENDAR }
                onClose={() => setShowModal(MODAL.UPDATE_TRIP)}
            >
                <View className="gap-4 mt-4">
                    <Calendar 
                        onDayPress={handleSelectedDate}
                        markedDates={selectedDates.dates}
                        minDate={ dayjs().toISOString() }
                    />
                    <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
                        <Button.Title>Confirmar</Button.Title>
                    </Button>
                </View>
            </Modal>

        </SafeAreaView>
    )
}