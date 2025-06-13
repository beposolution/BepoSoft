import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    formRows: [
        {
            id: 1,
            box: "Box 1",
            weight: "",
            length: "",
            breadth: "",
            height: "",
            image: null,
            packed_by: "",
            shipped_date: "",
            status: "",
        }
    ],
};

export const packingSlice = createSlice({
    name: 'packing',
    initialState,
    reducers: {
        addRow: (state) => {
            const newRow = {
                id: state.formRows.length + 1,
                box: `Box ${state.formRows.length + 1}`,
                weight: "",
                length: "",
                breadth: "",
                height: "",
                image: null,
                packed_by: "",
                shipped_date: "",
                status: "",
            };
            state.formRows.push(newRow);
        },
        deleteRow: (state, action) => {
            state.formRows = state.formRows.filter(row => row.id !== action.payload);
        },
        updateField: (state, action) => {
            const { id, name, value } = action.payload;
            const row = state.formRows.find(row => row.id === id);
            if (row) row[name] = value;
        },
        resetForm: (state) => {
            state.formRows = [
                {
                    id: 1,
                    box: "Box 1",
                    weight: "",
                    length: "",
                    breadth: "",
                    height: "",
                    image: null,
                    packed_by: "",
                    shipped_date: "",
                    status: "",
                }
            ];
        }
    }
});

export const { addRow, deleteRow, updateField, resetForm } = packingSlice.actions;
export default packingSlice.reducer;
