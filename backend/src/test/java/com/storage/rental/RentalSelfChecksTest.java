package com.storage.rental;

import org.junit.jupiter.api.Test;

class RentalSelfChecksTest {

    @Test
    void availabilityRulesHold() throws Exception {
        RentalAvailabilitySelfCheck.main(new String[0]);
    }

    @Test
    void handoverLifecycleHolds() throws Exception {
        RentalHandoverSelfCheck.main(new String[0]);
    }

    @Test
    void holdCreationGuardsOverlap() throws Exception {
        RentalHoldSelfCheck.main(new String[0]);
    }

    @Test
    void holdTimeoutAndLatePayment() throws Exception {
        RentalHoldTimeoutSelfCheck.main(new String[0]);
    }

    @Test
    void lifecycleRenewalAndCheckout() throws Exception {
        RentalLifecycleSelfCheck.main(new String[0]);
    }

    @Test
    void raceConditionsRemainSafe() throws Exception {
        RentalRaceSelfCheck.main(new String[0]);
    }

    @Test
    void rentalStateMachineRules() throws Exception {
        RentalSelfCheck.main(new String[0]);
    }

    @Test
    void stateMachineMatrixComplete() throws Exception {
        RentalStateMachineSelfCheck.main(new String[0]);
    }
}
