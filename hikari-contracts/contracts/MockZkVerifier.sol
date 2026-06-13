// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockZkVerifier {
    function verifyProof(bytes calldata proof, uint256[] calldata /* publicInputs */) external pure returns (bool) {
        // A standard hackathon mock verifier: proof is valid if it's not empty
        return proof.length > 0;
    }
}
