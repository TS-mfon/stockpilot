# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class RebalanceAdjudicator(gl.Contract):
    owner: Address
    decisions: TreeMap[str, str]

    def __init__(self, owner: str):
        self.owner = Address(owner)

    @gl.public.write
    def adjudicate(self, decision_id: str, request_json: str) -> None:
        request = json.loads(request_json)

        def draft() -> dict:
            return request.get("candidate", {})

        def validate(candidate: dict) -> bool:
            if candidate.get("decision") not in ["NO_ACTION", "PROPOSE", "REJECT"]:
                return False
            changes = candidate.get("changes", [])
            return len(changes) <= 8 and all(isinstance(change.get("asset_id"), str) and isinstance(change.get("delta_weight"), int) for change in changes)

        result = gl.vm.run_nondet_unsafe(draft, validate)
        if not validate(result):
            raise gl.vm.UserError("Invalid rebalance decision")
        self.decisions[decision_id] = json.dumps(result, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_decision(self, decision_id: str) -> dict:
        value = self.decisions.get(decision_id, "")
        return json.loads(value) if value else {}
