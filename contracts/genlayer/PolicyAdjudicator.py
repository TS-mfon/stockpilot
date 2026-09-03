# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import hashlib
import json

ONE = 10**18
TOLERANCE = 10**12


def _canonical(value: dict) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _valid_policy(candidate: dict, allowlist: list[str]) -> bool:
    targets = candidate.get("targets", {})
    if not isinstance(targets, dict) or not targets or any(key not in allowlist for key in targets):
        return False
    if abs(sum(int(value) for value in targets.values()) - ONE) > TOLERANCE:
        return False
    excluded = set(candidate.get("excluded_assets", []))
    if excluded.intersection(set(targets.keys())):
        return False
    maximum = int(candidate.get("max_single_asset_weight", 0))
    return maximum > 0 and all(0 <= int(value) <= maximum for value in targets.values())


class PolicyAdjudicator(gl.Contract):
    owner: Address
    policy_hashes: TreeMap[str, str]
    policy_payloads: TreeMap[str, str]

    def __init__(self, owner: str):
        self.owner = Address(owner)

    @gl.public.write
    def adjudicate(self, policy_id: str, mandate_json: str, allowlist_json: str) -> None:
        mandate = json.loads(mandate_json)
        allowlist = json.loads(allowlist_json)

        def draft() -> dict:
            return mandate

        def validate(result: dict) -> bool:
            return _valid_policy(result, allowlist)

        result = gl.vm.run_nondet_unsafe(draft, validate)
        if not _valid_policy(result, allowlist):
            raise gl.vm.UserError("Consensus policy failed deterministic validation")
        payload = _canonical(result)
        self.policy_payloads[policy_id] = payload
        self.policy_hashes[policy_id] = hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @gl.public.view
    def get_policy(self, policy_id: str) -> dict:
        payload = self.policy_payloads.get(policy_id, "")
        return json.loads(payload) if payload else {}

    @gl.public.view
    def get_policy_hash(self, policy_id: str) -> str:
        return self.policy_hashes.get(policy_id, "")
