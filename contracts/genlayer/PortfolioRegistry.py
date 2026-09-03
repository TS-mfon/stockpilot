# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import hashlib
import json


class PortfolioRegistry(gl.Contract):
    owner: Address
    versions: TreeMap[str, str]
    latest: TreeMap[str, u256]

    def __init__(self, owner: str):
        self.owner = Address(owner)

    @gl.public.write
    def commit_version(self, portfolio_id: str, payload_json: str) -> int:
        payload = json.loads(payload_json)
        if not payload.get("portfolio_hash") or not payload.get("allocations"):
            raise gl.vm.UserError("Invalid portfolio payload")
        version = int(self.latest.get(portfolio_id, u256(0))) + 1
        record = {"version": version, "payload": payload, "payload_hash": hashlib.sha256(payload_json.encode("utf-8")).hexdigest()}
        self.versions[portfolio_id + ":" + str(version)] = json.dumps(record, sort_keys=True, separators=(",", ":"))
        self.latest[portfolio_id] = u256(version)
        return version

    @gl.public.view
    def get_version(self, portfolio_id: str, version: int) -> dict:
        value = self.versions.get(portfolio_id + ":" + str(version), "")
        return json.loads(value) if value else {}
