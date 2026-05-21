// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PiAnimals721Base} from "./PiAnimals721Base.sol";

contract PiAnimalsCat721 is PiAnimals721Base {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address royaltyReceiver,
        uint96 royaltyFeeBps,
        uint256 maxSupply_
    ) external initializer {
        __PiAnimals721Base_init(
            "PI ANIMALS Cat",
            "PACAT",
            admin,
            royaltyReceiver,
            royaltyFeeBps,
            maxSupply_
        );
    }
}
