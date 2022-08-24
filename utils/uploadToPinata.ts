import pinataSDK from "@pinata/sdk"
import fs from "fs"
import path from "path"

const pinataApiKey = process.env.PINATA_API_KEY || ""
const pinataApiSecret = process.env.PINATA_API_SECRET || ""
const pinata = pinataSDK(pinataApiKey, pinataApiSecret)

export async function storeImages(imagesFilePath: string) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagesPath)
    let responses = []
    for (const fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        } catch (err) {
            console.log(err)
        }
    }
    return { responses, files }
}

export async function storeTokenUriMetada(metadata: Object) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (err) {
        console.log(err)
    }
    return null
}
