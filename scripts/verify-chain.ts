import { verifyChain } from "@/lib/activity";
verifyChain().then((r) => { console.log(JSON.stringify(r)); process.exit(0); });
