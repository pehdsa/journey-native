import { useState, useEffect } from "react";
import { View, Text, Image, Keyboard, Alert } from "react-native";
import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight, AtSign } from "lucide-react-native"; 
import { DateData } from "react-native-calendars"
import dayjs from "dayjs";
import { tripStorage } from "@/storage/trip";
import { router } from "expo-router";
import { triServer } from "@/server/trip-server";

import { colors } from "@/styles/colors";
import { DatesSelected, calendarUtils } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";

import { Input, Button, Modal, Calendar, GuestEmail, Loading } from "@/components";

enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAIL=2
}

enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    GUESTS = 2
}

export default function Index(){
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
    const [showModal, setShowModal] = useState(MODAL.NONE);
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
    const [destination, setDestination] = useState('');
    const [emailToInvite, setEmailToInvite] = useState("");
    const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingTrip, setIsGettingTrip] = useState(true);

    const handleNextStepForm = () => {
        if (destination.trim().length === 0 || !selectedDates.startsAt || !selectedDates.endsAt) {
            return Alert.alert("Detalhes da viagem", "Preencha todas as informações da viagem para seguir")
        }

        if (destination.trim().length < 4 ) {
            return Alert.alert("Detalhes da viagem", "O destino deve ter pelo menos 4 caracteres")
        }

        if (stepForm === StepForm.TRIP_DETAILS) {
            return setStepForm(StepForm.ADD_EMAIL);
        }

        Alert.alert("Nova Viagem", "Confirmar viagem?", [
            {
                text: "Não",
                style: "cancel"
            },
            {
                text: "Sim",
                onPress: handleCreateTrip
            }
        ]);
    }

    const handleSelectedDate = (selectedDay: DateData) => {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates);
    }

    const handleRemoveEmail = (emailToRemove: string) => {
        setEmailsToInvite(prevState => prevState.filter(item => item !== emailToRemove));
    }

    const handleAddEmail = () => {
        if (emailToInvite.trim().length === 0 || !validateInput.email(emailToInvite) || emailsToInvite.includes(emailToInvite)) {
            return Alert.alert("Oops..", "Digite um e-mail válido");
        }
        setEmailsToInvite([ ...emailsToInvite, emailToInvite ]);
        setEmailToInvite("");
    }

    const saveTrip = async (tripId: string) => {
        try {
            await tripStorage.save(tripId);
            router.navigate(`/trip/${ tripId }`);
        } catch (error) {
            Alert.alert("Salvar viagem", "Não foi possível salvar o id da viagem no dispositivo");
            console.log(error)
        }
    }

    const handleCreateTrip = async () => {
        if (destination.length === 0 || emailsToInvite.length === 0) {
            return Alert.alert("Salvar viagem", "Digite todos os campos");            
        }
        setIsLoading(true);
        try {
            const newTrip = await triServer.create({
                destination,
                starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
                emails_to_invite: emailsToInvite
            });
            saveTrip(newTrip);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    const getTrip = async () => {
        try {
            const tripId = await tripStorage.get();
            if (!tripId) {
                return setIsGettingTrip(false);
            }
            const trip = await triServer.getById(tripId);            
            if (!trip) {
                await tripStorage.remove()
                return setIsGettingTrip(false);
            }
            return router.navigate(`/trip/${ tripId }`)
        } catch (error) {
            setIsGettingTrip(false);
        }
    }

    useEffect(() => {
        getTrip();
    },[]);

    if (isGettingTrip) {
        return <Loading />
    }

    return (
        <View className="flex-1 items-center justify-center px-5">
            <Image 
                source={require("@/assets/logo.png")} 
                className="h-8" 
                resizeMode="contain" 
            />

            <Image 
                source={require("@/assets/bg.png")} 
                className="absolute top-0" 
                resizeMode="contain" 
            />

            <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
                Convide seus amigos e planeje sua{'\n'} próxima viagem
            </Text>
            
            <View className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800">
                <Input>
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        placeholder="Para Onde?" 
                        editable={stepForm === StepForm.TRIP_DETAILS} 
                        onChangeText={setDestination}
                        value={destination}
                    />
                </Input>
                
                <Input>
                    <IconCalendar color={colors.zinc[400]} size={20} />
                    <Input.Field 
                        placeholder="Quando?" 
                        editable={stepForm === StepForm.TRIP_DETAILS} 
                        onFocus={() => Keyboard.dismiss()} 
                        showSoftInputOnFocus={false}
                        onPressIn={() => stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)}
                        value={ selectedDates.formatDatesInText }
                    />
                </Input>

                { stepForm === StepForm.ADD_EMAIL && (
                    <View className="mt-1">
                        <View className="w-full border-b border-zinc-800 py-3 mb-1">
                            <Button variant="secondary" onPress={() => setStepForm(StepForm.TRIP_DETAILS) }>
                                <Button.Title>Alterar local/data</Button.Title>
                                <Settings2 color={colors.zinc[200]} size={20} />
                            </Button>
                        </View>                    
                        <Input>
                            <UserRoundPlus color={colors.zinc[400]} size={20} />
                            <Input.Field 
                                placeholder="Quem estará na viagem?" 
                                onFocus={() => Keyboard.dismiss()} 
                                showSoftInputOnFocus={false}
                                onPressIn={() => stepForm === StepForm.ADD_EMAIL && setShowModal(MODAL.GUESTS)}
                                value={emailsToInvite.length > 0 ? `${ emailsToInvite.length } convidado(s)` : ''}
                                autoCorrect={false}
                            />
                        </Input>
                    </View>
                ) }
                
                <View className="mt-1">
                    <Button onPress={ handleNextStepForm } isLoading={ isLoading }>
                        <Button.Title>{ stepForm === StepForm.TRIP_DETAILS ? 'Continuar' : 'Confirmar Viagem' }</Button.Title>
                        <ArrowRight color={colors.lime[950]} size={20} />
                    </Button>                
                </View>

            </View>

            <Text className="text-zinc-500 font-regular text-center text-base">
                Ao planejar sua viagem pela plann.er você automáticamente concorda com nossos{'\n'} <Text className="text-zinc-300 underline">termos de uso</Text> e <Text className="text-zinc-300 underline">política de privacidade</Text>
            </Text>

            <Modal
                title="Selecionar datas"
                subtitle="Selecione a data de ida e volta da viagem"
                visible={ showModal === MODAL.CALENDAR }
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="gap-4 mt-4">
                    <Calendar 
                        onDayPress={handleSelectedDate}
                        markedDates={selectedDates.dates}
                        minDate={ dayjs().toISOString() }
                    />
                    <Button onPress={() => setShowModal(MODAL.NONE)}>
                        <Button.Title>Confirmar</Button.Title>
                    </Button>
                </View>
            </Modal>

            
            <Modal
                title="Selecionar convidados"
                subtitle="Os convidados irão receber e-mail para confirmar a participação da viagem"
                visible={ showModal === MODAL.GUESTS }
                onClose={() => setShowModal(MODAL.NONE)}
            >
                
                <View className="w-full my-2 flex-row flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
                    { emailsToInvite.length > 0 ? (
                        emailsToInvite.map(email => (
                            <GuestEmail  
                                key={email}
                                email={email}
                                onRemove={() => handleRemoveEmail(email)}
                            />
                        ))
                    ) : (
                        <Text className="text-zinc-600 text-base font-regular">Nenhum e-mail adicionado</Text>
                    ) }
                </View>
                
                <View className="gap-4 mt-4">
                    <Input variant="secondary">      
                        <AtSign color={colors.zinc[400]} size={20} />                  
                        <Input.Field 
                            placeholder="Digite o email do convidado"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={setEmailToInvite}
                            value={ emailToInvite }
                            onBlur={handleAddEmail}
                            returnKeyType="send"
                        />
                    </Input>

                    <Button onPress={handleAddEmail}>
                        <Button.Title>Convidar</Button.Title>
                    </Button>
                </View>
                
            </Modal>

        </View>
    )
}