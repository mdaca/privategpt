import { BufferWindowMemory } from "langchain/memory";

export class PGPTBufferWindowMemory extends BufferWindowMemory {
    /**
     * Method to add user and AI messages to the chat history in sequence.
     * @param inputValues The input values from the user.
     * @param outputValues The output values from the AI.
     * @returns Promise that resolves when the context has been saved.
     */ async saveContext(inputValues, outputValues) {
        // this is purposefully done in sequence so they're saved in order
        await this.chatHistory.addUserMessage(inputValues.question);
        
        let ret = outputValues.text;

        if(outputValues.sourceDocuments) {
            ret += ' \r\n \r\n `Sources`'
  
            // for(let i = 0; i < outputValues.sourceDocuments.length; i++) {
            //   let doc = outputValues.sourceDocuments[i];
            //   ret += ' \r\n \r\n' + JSON.stringify(doc.metadata);
            // }

            ret += JSON.stringify(outputValues.sourceDocuments.map((item) => { return item.metadata; }));
        }

        await this.chatHistory.addAIChatMessage(ret);
    }
}