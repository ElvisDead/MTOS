export const KinRegistry = {

    toIndex(kin){
        return kin - 1
    },

    fromIndex(i){
        return i + 1
    },

    toGrid(kin){
        const i = kin - 1
        const seal = Math.floor(i / 13)
        const tone = i % 13
        return { seal, tone }
    },

    fromGrid(seal, tone){
        return ((seal * 13 + tone) % 260) + 1
    }
}
