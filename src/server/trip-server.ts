import { api } from "./api";

export type TripDetails = {
    id: string,
    destination: string,
    starts_at: string,
    ends_at: string,
    is_confirmed: boolean
}

type TripCreate = Omit<TripDetails, "id" | "is_confirmed"> & {
    owner_name?: string,
    owner_email?: string,
    emails_to_invite: Array<string>
}

async function getById(id: string) {
    try {
        const { data } = await api.get<{ trip: TripDetails }>(`trip/${ id }`);
        return data.trip;
    } catch (error) {
        throw error;
    }
}

async function create({ 
    destination, 
    starts_at, 
    ends_at, 
    owner_name = "Pedro Henrique", 
    owner_email = "pedro@teste.com.br", 
    emails_to_invite 
}: TripCreate) {
    try {
        const { data } = await api.post<{ tripId: string }>(`trips`, {
            destination,
            starts_at,
            ends_at,
            owner_name,
            owner_email,
            emails_to_invite
        });
        return data.tripId;
    } catch (error) {
        throw error;
    }
}

async function update({ id, destination, ends_at, starts_at }: Omit<TripDetails, "is_confirmed">) {
    try {
        const { data } = await api.put<{ tripId: string }>(`trips/${ id }`, {
            destination,
            starts_at,
            ends_at
        });
        return data.tripId;
    } catch (error) {
        throw error;
    }
}

export const triServer = { getById, create, update }